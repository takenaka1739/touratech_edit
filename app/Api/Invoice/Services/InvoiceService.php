<?php

namespace App\Api\Invoice\Services;

use App\Base\Models\Config;
use App\Base\Models\Customer;
use App\Base\Models\Invoice;
use App\Base\Models\InvoiceDetail;
use App\Base\Models\Receipt;
use App\Base\Models\Sales;
use App\Base\Models\SalesDetail;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;

/**
 * 請求データサービス
 */
class InvoiceService
{
  /**
   * 一覧データを取得する
   *
   * @param array $cond 検索条件
   * @return array
   */
  public function fetch(array $cond)
  {
    $query = Invoice::select();
    $query = $this->setCondition($query, $cond);
    $query->orderBy('invoice_month', 'desc')
      ->orderBy('customer_id', 'desc');
    return $query->paginate(config('const.paginate.per_page'))->toArray();
  }

  /**
   * 月締処理済みのデータが存在する場合true
   *
   * @param array $cond 条件
   * @return boolean
   */
  public function hasClosing(array $cond)
  {
    $cond = new Collection($cond);
    $invoice_month = $cond->get('c_invoice_month');

    $count = Invoice::where('invoice_month', $invoice_month)->count();

    return $count > 0;
  }

  /**
   * 月締処理
   *
   * @param array $cond 条件
   */
  public function closing(array $cond)
  {
    $cond = new Collection($cond);
    $invoice_month = $cond->get('c_invoice_month');
    $cutoff_date = $cond->get('c_cutoff_date');

    DB::transaction(function () use ($invoice_month, $cutoff_date) {

      /**
       * 0) 既存の当月請求データ（必要なら締日指定分）に紐づく link を先に消す
       *    ※現行DBは invoice_id にFKが無いので、ここで消さないと「請求済み」が残る
       */
      $invoiceIdsQuery = Invoice::query()
        ->where('invoice_month', $invoice_month);

      if ($cutoff_date) {
        $invoiceIdsQuery->join('t_customers', 't_customers.id', '=', 't_invoices.customer_id')
          ->where('t_customers.cutoff_date', '=', $cutoff_date);
      }

      // pluck は join が入っても t_invoices.id を取れるよう明示
      $invoiceIds = $invoiceIdsQuery->pluck('t_invoices.id');

      if ($invoiceIds->isNotEmpty()) {
        // 売上↔請求 link を削除
        DB::table('t_link_sales_invoice')
          ->whereIn('invoice_id', $invoiceIds)
          ->delete();

        // 入金↔請求 link を削除（存在する場合のみ）
        if (Schema::hasTable('t_link_receipt_invoice')) {
          DB::table('t_link_receipt_invoice')
            ->whereIn('invoice_id', $invoiceIds)
            ->delete();
        }
      }

      /**
       * 1) 既存の当月請求データを削除
       *    ※Invoice の delete で t_invoice_details が消えない設計なら、
       *      t_invoice_details 側も別途削除が必要（ここでは既存仕様に合わせて Invoice delete に寄せる）
       */
      if ($cutoff_date) {
        Invoice::join('t_customers', 't_customers.id', '=', 't_invoices.customer_id')
          ->where('t_invoices.invoice_month', $invoice_month)
          ->where('t_customers.cutoff_date', '=', $cutoff_date)
          ->delete();
      } else {
        Invoice::where('invoice_month', $invoice_month)->delete();
      }

      $config = Config::getSelf();

      $sales_list = $this->getSales($invoice_month, $cutoff_date);
      $receipts_list = $this->getReceipts($invoice_month, $cutoff_date);
      $customers = Customer::get();
      $pre_invoices_list = $this->getLatestInvoices($invoice_month);

      // 売上データと入金データから得意先IDを取得する
      $Ids = $this->getCustomerIds($sales_list, $receipts_list);

      foreach ($Ids as $id) {
        $customer = $customers->where('id', $id)->first();
        if (!$customer) {
          Log::warning('[InvoiceService] customer not found', [
            'customer_id' => $id,
            'invoice_month' => $invoice_month,
          ]);
          continue;
        }

        $sales = $sales_list->where('customer_id', $id);
        $receipts = $receipts_list->where('customer_id', $id);
        $pre_invoices = $pre_invoices_list->where('customer_id', $id)->first();

        $invoice_date = get_cutoff_date($invoice_month, $customer->cutoff_date);
        $sales_tax_rate = $config->getSalesTaxRate($invoice_date);

        // 売上データから明細を作成する
        $sales_details = $this->createDetailsBySales($sales, $sales_tax_rate);
        // 入金データから明細を作成する
        $receipts_details = $this->createDetailsByReceipts($receipts);

        $total_amount = $sales_details->sum('amount');
        $total_tax = $sales_details->sum('sales_tax');
        $total_receipt = $receipts_details->sum('amount');

        $pre_amount = $pre_invoices ? $pre_invoices->total_invoice : 0;
        $carried_forward = $pre_amount - $total_receipt;

        // ★ 住所の NULL を回避
        [$zip, $address1, $address2] = $this->resolveCustomerAddress($customer);

        $m = Invoice::create([
          'invoice_date' => $invoice_date,
          'invoice_month' => $invoice_month,
          'customer_id' => $id,
          'customer_name' => $customer->name,
          'zip_code' => $zip,
          'address1' => $address1,
          'address2' => $address2,
          'tel' => (string)($customer->tel ?? ''),
          'fax' => (string)($customer->fax ?? ''),
          'user_id' => Auth::user()->id,
          'pre_amount' => $pre_amount,
          'total_receipt' => $total_receipt,
          'carried_forward' => $carried_forward,
          'total_amount' => $total_amount,
          'total_tax' => $total_tax,
          'total_invoice' => $carried_forward + $total_amount,
        ]);

        // 売上と入金の明細を結合して登録する
        $details = $sales_details->merge($receipts_details);
        $details = $details->map(function ($detail, $key) use ($m) {
          $detail['invoice_id'] = $m->id;
          $detail['no'] = $key + 1;
          return $detail;
        });
        DB::table('t_invoice_details')->insert($details->toArray());

        // 売上請求連結データを登録する
        $this->insertSalesInvoice($sales, $m->id);

        // 入金請求連結データを登録する
        $this->insertReceiptInvoice($receipts, $m->id);
      }

      // 請求残がある請求データを作成する
      $this->createInvoiceFromRemainingBill($invoice_month, $customers);
    });
  }

  /**
   * 締取消
   *
   * @param array $cond 条件
   */
  public function cancelClosing(array $cond)
  {
    $cond = new Collection($cond);
    $invoice_month = $cond->get('c_invoice_month');

    DB::transaction(function () use ($invoice_month) {
      // 1) 当月 invoice_id を取得
      $invoiceIds = Invoice::where('invoice_month', $invoice_month)->pluck('id');

      if ($invoiceIds->isNotEmpty()) {
        // 2) 売上↔請求 link を削除
        DB::table('t_link_sales_invoice')
          ->whereIn('invoice_id', $invoiceIds)
          ->delete();

        // 3) 入金↔請求 link を削除（存在する場合のみ）
        if (Schema::hasTable('t_link_receipt_invoice')) {
          DB::table('t_link_receipt_invoice')
            ->whereIn('invoice_id', $invoiceIds)
            ->delete();
        }
      }

      // 4) 請求データを削除
      Invoice::where('invoice_month', $invoice_month)->delete();
    });
  }

  /**
   * 請求書用データを作成する
   *
   * @param array $cond 条件
   * @return array
   */
  public function getPdfData(array $cond)
  {
    $input = new Collection($cond);
    $invoice_month = $input->get('c_invoice_month');
    $selected = $input->get('selected');

    $configs = Config::getSelf();

    $query = Invoice::select([
      't_invoices.id',
      'invoice_date',
      'customer_id',
      'customer_name',
      'zip_code',
      'address1',
      'address2',
      'user_id',
      'pre_amount',
      'total_receipt',
      'carried_forward',
      'total_amount',
      'total_tax',
      'total_invoice',
      // 'link_sales_invoice.sale_id',
    ]);
    // ->leftJoin('t_link_sales_invoice', 't_link_sales_invoice.invoice_id', '=', 't_invoices.id');
    $query = $this->setCondition($query, $cond);
    $rows = $query->whereIn('id', $selected)
      ->orderBy('invoice_date', 'desc')
      ->orderBy('customer_id', 'desc')
      ->get();

    $configs = Config::getSelf();

    $data = [];
    $currentUserName = Auth::user()?->name ?? '';
    foreach ($rows as $row) {
      $d = $row->toArray();
      $d["details"] = $row->details->toArray();
      $d["config_data"] = $configs;
      $d["customer_data"] = Customer::find($row->customer_id);
      $d["user_name"] = $currentUserName;

      $data[] = $d;
    }

    return [
      'invoice_month' => $invoice_month,
      'data' => $data,
      'config_data' => $configs->toArray(),
      'user_name' => $currentUserName,
    ];
  }

  /**
   * 一覧用データを作成する
   *
   * @param array $cond 条件
   * @return array
   */
  public function getListPdfData(array $cond)
  {
    $input = new Collection($cond);
    $invoice_month = $input->get('c_invoice_month');
    $selected = $input->get('selected');

    $query = Invoice::select();
    $query = $this->setCondition($query, $cond);
    $query->whereIn('id', $selected);
    $query->orderBy('invoice_date', 'desc')
      ->orderBy('customer_id', 'desc');
    return [
      'invoice_month' => $invoice_month,
      'data' => $query->get()->toArray(),
      'user_name' => Auth::user()?->name ?? '',
    ];
  }

  /**
   * 条件を設定する
   *
   * @param \Illuminate\Database\Eloquent\Builder $query
   * @param array $cond 条件
   * @return mixed
   */
  private function setCondition($query, array $cond)
  {
    $cond = new Collection($cond);

    $c_invoice_month = $cond->get('c_invoice_month');
    if ($c_invoice_month) {
      $query->where('invoice_month', '=', $c_invoice_month);
    }
    return $query;
  }

  /**
   * 得意先の請求範囲を取得する
   *
   * @param string $invoice_month
   * @param int|null $cutoff_date
   * @return Collection
   */
  private function getBillingRange(string $invoice_month, $cutoff_date = null)
  {
    $cur_dt = new Carbon($invoice_month . "/01");
    $cur_ym = $cur_dt->format('Y/m/');
    $cur_last_day = $cur_dt->lastOfMonth()->day;

    $pre_dt = new Carbon($invoice_month . "/01");
    $pre_dt->subMonth();
    $pre_ym = $pre_dt->format('Y/m/');
    $pre_last_day = $pre_dt->lastOfMonth()->day;

    $tmp_dt = new Carbon($invoice_month . "/01");
    $tmp_dt->subMonth();

    $rows = DB::table('t_customers')
      ->whereExists(function ($query) use ($tmp_dt) {
        $query->select(DB::raw(1))
          ->from('t_sales')
          ->whereRaw('t_sales.customer_id = t_customers.id')
          ->where('t_sales.sales_at', '>=', $tmp_dt);
      })
      ->orWhere(function ($query) use ($tmp_dt) {
        $query->whereExists(function ($query) use ($tmp_dt) {
          $query->select(DB::raw(1))
            ->from('t_receipts')
            ->whereRaw('t_receipts.customer_id = t_customers.id')
            ->where('t_receipts.receipt_date', '>=', $tmp_dt);
        });
      })
      ->get();
    $range = [];
    foreach ($rows as $row) {
      $c = $row->cutoff_date;
      if ($cutoff_date && $c != $cutoff_date) {
        continue;
      }

      if ($c == 31 || $c >= $pre_last_day) {
        $date_from = $cur_ym . "01";
      } else {
        $date_from = $pre_ym . str_pad($c + 1, 2, '0', STR_PAD_LEFT);
      }
      if ($c == 31 || $c > $cur_last_day) {
        $date_to = $cur_ym . str_pad($cur_last_day, 2, '0', STR_PAD_LEFT);
      } else {
        $date_to = $cur_ym . str_pad($c, 2, '0', STR_PAD_LEFT);
      }

      $range[] = [
        'customer_id' => $row->id,
        'date_from' => $date_from,
        'date_to' => $date_to
      ];
    }
    return new Collection($range);
  }

  /**
   * 売上データを取得する
   *
   * @param string $invoice_month 請求月
   * @param int|null $cutoff_date 締日
   * @return Collection
   */
  private function getSales(string $invoice_month, $cutoff_date)
  {
    $range = $this->getBillingRange($invoice_month, $cutoff_date);
    $data = new Collection();
    foreach ($range as $r) {
      $rows = Sales::where('customer_id', '=', $r['customer_id'])
        ->where('sales_at', '>=', $r['date_from'])
        ->where('sales_at', '<=', $r['date_to'])
        ->where('payment_id', '=', 2)
        ->get();
      $data = $data->merge($rows);
    }
    return $data;
  }

  /**
   * 入金データを取得する
   *
   * @param string $invoice_month 請求月
   * @param int|null $cutoff_date 締日
   * @return Collection
   */
  private function getReceipts(string $invoice_month, $cutoff_date)
  {
    $range = $this->getBillingRange($invoice_month, $cutoff_date);
    $data = new Collection();
    foreach ($range as $r) {
      $rows = Receipt::where('customer_id', '=', $r['customer_id'])
        ->where('receipt_date', '>=', $r['date_from'])
        ->where('receipt_date', '<=', $r['date_to'])
        ->get();
      $data = $data->merge($rows);
    }
    return $data;
  }

  /**
   * 最新の請求書を取得する
   *
   * @param string $invoice_month 請求月
   * @return Collection
   */
  private function getLatestInvoices(string $invoice_month)
  {
    $rows = DB::table('t_invoices')
      ->join(DB::raw("(SELECT b.customer_id, MAX(b.invoice_month) AS invoice_month FROM t_invoices b WHERE b.invoice_month < '" . $invoice_month . "' GROUP BY b.customer_id) AS x"), function ($join) {
        $join->on('x.invoice_month', "=", 't_invoices.invoice_month')
          ->on('x.customer_id', "=", 't_invoices.customer_id');
      })
      ->select(
        't_invoices.customer_id',
        'total_invoice'
      )
      ->get();

    return $rows;
  }

  /**
   * 売上データと入金データから得意先IDを取得する
   *
   * @param Collection $sales 売上データ
   * @param Collection $receipts 入金データ
   */
  private function getCustomerIds($sales, $receipts)
  {
    $group_sales = $sales->groupBy('customer_id')->keys();
    $group_receipts = $receipts->groupBy('customer_id')->keys();

    return $group_sales->merge($group_receipts)->unique();
  }

  /**
   * 売上データから明細を作成する
   *
   * @param Collection $sales 売上データ
   * @param float $sales_tax_rate 消費税率
   * @return Collection
   */
  private function createDetailsBySales($sales, $sales_tax_rate)
  {
    $details = [];

    foreach ($sales as $s) {
      $ds = $this->getSalesDetails($s->id);

      foreach ($ds as $d) {
        $details[] = [
          'job_date' => $s->sales_at,
          'detail_kind' => 1,
          'item_kind' => $d->item_kind,
          'item_id' => $d->item_id,
          'item_name' => trim(($d->item_name ?? '') . ' ' . ($d->parent_item_name ?? '')),
          'unit_price' => $d->unit_price,
          'quantity' => $d->quantity,
          'amount' => $d->amount,
          'sales_tax_rate' => $d->sales_tax_rate,
          'sales_tax' => $d->sales_tax,
        ];
      }

      // 送料
      $details[] = [
        'job_date' => $s->sales_at,
        'detail_kind' => 1,
        'item_kind' => null,
        'item_id' => null,
        'item_name' => '送料',
        'unit_price' => null,
        'quantity' => null,
        'amount' => $s->shipping_amount,
        'sales_tax_rate' => $sales_tax_rate,
        'sales_tax' => get_sales_tax2($s->shipping_amount ?? 0, $sales_tax_rate, 1),
      ];

      // 別途追加送料
      if (($s->additional_shipping_amount ?? 0) != 0) {
        $details[] = [
          'job_date' => $s->sales_at,
          'detail_kind' => 1,
          'item_kind' => null,
          'item_id' => null,
          'item_name' => '別途追加送料',
          'unit_price' => null,
          'quantity' => null,
          'amount' => $s->additional_shipping_amount,
          'sales_tax_rate' => $sales_tax_rate,
          'sales_tax' => get_sales_tax2($s->additional_shipping_amount ?? 0, $sales_tax_rate, 1),
        ];
      }

      // 手数料
      $details[] = [
        'job_date' => $s->sales_at,
        'detail_kind' => 1,
        'item_kind' => null,
        'item_id' => null,
        'item_name' => '手数料',
        'unit_price' => null,
        'quantity' => null,
        'amount' => $s->fee,
        'sales_tax_rate' => $sales_tax_rate,
        'sales_tax' => get_sales_tax2($s->fee ?? 0, $sales_tax_rate, 1),
      ];

      // 値引額
      $details[] = [
        'job_date' => $s->sales_at,
        'detail_kind' => 1,
        'item_kind' => null,
        'item_id' => null,
        'item_name' => '値引額',
        'unit_price' => null,
        'quantity' => null,
        'amount' => ($s->discount ?? 0) * -1,
        'sales_tax_rate' => $sales_tax_rate,
        'sales_tax' => get_sales_tax2($s->discount ?? 0, $sales_tax_rate, 1) * -1,
      ];
    }
    return new Collection($details);
  }

  /**
   * 入金データから明細を作成する
   *
   * @param Collection $receipt 入金データ
   * @return Collection
   */
  private function createDetailsByReceipts($receipts)
  {
    $details = [];

    foreach ($receipts as $r) {
      $details[] = [
        'job_date' => $r->receipt_date,
        'detail_kind' => 2,
        'item_kind' => null,
        'item_id' => null,
        'item_name' => '入金',
        'unit_price' => null,
        'quantity' => null,
        'amount' => $r->total_amount,
        'sales_tax_rate' => 0,
        'sales_tax' => 0,
      ];
    }
    return new Collection($details);
  }

  /**
   * 売上請求連結データを登録する
   *
   * @param Collection $sales 売上データ
   * @param in $invoice_id 請求ID
   */
  private function insertSalesInvoice($sales, int $invoice_id)
  {
    $data = [];
    foreach ($sales as $s) {
      $data[] = [
        'sales_id' => $s->id,
        'invoice_id' => $invoice_id,
      ];
    }
    if (!empty($data)) {
      DB::table('t_link_sales_invoice')->insert($data);
    }
  }

  /**
   * 入金請求連結データを登録する
   *
   * @param Collection $receipts 入金データ
   * @param in $invoice_id 請求ID
   */
  private function insertReceiptInvoice($receipts, int $invoice_id)
  {
    $data = [];
    foreach ($receipts as $r) {
      $data[] = [
        'receipt_id' => $r->id,
        'invoice_id' => $invoice_id,
      ];
    }
    if (!empty($data)) {
      DB::table('t_link_receipt_invoice')->insert($data);
    }
  }

  /**
   * 売上明細を取得する
   *
   * @param int $salesId
   */
  private function getSalesDetails(int $salesId)
  {
    // parent_id が無い環境でも落とさない（まずは明細を取る）
    $hasParentId = Schema::hasColumn('t_sale_details', 'parent_id');

    $q = DB::table('t_sale_details as d')
      ->leftJoin('m_items as mi', 'mi.id', '=', 'd.item_id')
      ->select([
        'd.*',
        DB::raw('mi.name as item_name'),
        DB::raw("'' as parent_item_name"),
      ])
      ->where('d.sale_id', '=', $salesId)
      ->where('d.item_kind', '<>', 2);

    if ($hasParentId) {
      $q->leftJoin('t_sale_details as x', 'x.id', '=', 'd.parent_id')
        ->leftJoin('m_items as mi_parent', 'mi_parent.id', '=', 'x.item_id')
        ->addSelect(DB::raw('mi_parent.name as parent_item_name'));
    }

    return $q->get();
  }

  /**
   * 請求残がある請求データを作成する
   *
   * @param string $invoice_month 請求月
   */
  private function createInvoiceFromRemainingBill($invoice_month, $customers)
  {
    $rows = $this->getInvoiceFromRemainingBill($invoice_month);

    foreach ($rows as $row) {
      $customer = $customers->where('id', $row->customer_id)->first();
      if (!$customer) {
        Log::warning('[InvoiceService] customer not found (remaining bill)', [
          'customer_id' => $row->customer_id,
          'invoice_month' => $invoice_month,
        ]);
        continue;
      }

      $invoice_date = get_cutoff_date($invoice_month, $customer->cutoff_date);

      // ★ 住所の NULL を回避
      [$zip, $address1, $address2] = $this->resolveCustomerAddress($customer);

      Invoice::create([
        'invoice_date' => $invoice_date,
        'invoice_month' => $invoice_month,
        'customer_id' => $row->customer_id,
        'customer_name' => $customer->name,
        'zip_code' => $zip,
        'address1' => $address1,
        'address2' => $address2,
        'tel' => (string)($customer->tel ?? ''),
        'fax' => (string)($customer->fax ?? ''),
        'user_id' => Auth::user()->id,
        'pre_amount' => $row->total_invoice,
        'total_invoice' => $row->total_invoice,
      ]);
    }
  }

  /**
   * 請求残があるデータを取得する
   *
   * @param string $invoice_month 請求月
   */
  private function getInvoiceFromRemainingBill($invoice_month)
  {
    return DB::table('t_invoices')
      ->select([
        't_invoices.customer_id',
        'total_invoice',
      ])
      ->join(DB::raw("(SELECT b.customer_id, MAX(b.invoice_month) AS invoice_month FROM t_invoices b WHERE b.invoice_month < '" . $invoice_month . "' GROUP BY b.customer_id) AS x"), function ($join) {
        $join->on('x.invoice_month', "=", 't_invoices.invoice_month')
          ->on('x.customer_id', "=", 't_invoices.customer_id');
      })
      ->whereNotExists(function ($q) use ($invoice_month) {
        $q->select(DB::raw(1))
          ->from('t_invoices as z')
          ->where('z.invoice_month', '=', $invoice_month)
          ->whereRaw('z.customer_id = t_invoices.customer_id');
      })
      ->where('total_invoice', '<>', 0)
      ->get();
  }

  /**
   * 住所を NOT NULL で確実に作る
   */
  private function resolveCustomerAddress(Customer $customer): array
  {
    $zip = (string)($customer->zip_code ?? '');

    $address1 = $customer->address1 ?? null;
    $address2 = $customer->address2 ?? null;

    if (empty($address1)) {
      $pref = $customer->prefectures ?? '';
      $muni = $customer->municipality ?? '';
      $num = $customer->number ?? '';

      $built1 = trim($pref . $muni);
      $built2 = trim($num);

      $address1 = $built1 !== '' ? $built1 : '';
      $address2 = $built2 !== '' ? $built2 : ($address2 ?? '');
    }

    $address1 = (string)($address1 ?? '');
    $address2 = (string)($address2 ?? '');

    return [$zip, $address1, $address2];
  }
}
