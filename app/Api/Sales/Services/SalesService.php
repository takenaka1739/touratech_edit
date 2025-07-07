<?php

namespace App\Api\Sales\Services;

use App\Base\Models\Config;
use App\Base\Models\Customer;
use App\Base\Models\Inventory;
use App\Base\Models\InventoryMove;
use App\Base\Models\Item;
use App\Base\Models\ReceiveOrder;
use App\Base\Models\Sales;
use App\Base\Models\SalesDetail;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

/**
 * 売上データサービス
 */
class SalesService
{
  /**
   * 検索画面用の一覧データを取得する
   *
   * @param array $cond 検索条件
   * @return array
   */
  public function dialog(array $cond)
  {
    $query = Sales::select(
      'sales.id',
      'sales_date',
      'customer_name',
      'total_amount',
      'users.name AS user_name',
      DB::raw('EXISTS(SELECT * FROM link_sales_invoice x WHERE x.sales_id = sales.id) AS has_invoice')
    );
    $query = $this->setCondition($query, $cond);
    $query->orderBy('sales_date', 'desc')
      ->orderBy('sales.id', 'desc');
    return $query->paginate(config('const.paginate.per_page'))->toArray();
  }

  /**
   * 一覧データを取得する
   *
   * @param array $cond 検索条件
   * @return array
   */
  public function fetch(array $cond)
  {

    $query = Sales::select(
      'sales.id',
      'sales_date',
      'customer_name',
      'total_amount',
      'users.name AS user_name',
      DB::raw('EXISTS(SELECT * FROM link_sales_invoice x WHERE x.sales_id = sales.id) AS has_invoice')
    );
    $query = $this->setCondition($query, $cond);
    $query->orderBy('sales_date', 'desc')
      ->orderBy('sales.id', 'desc');
    return $query->paginate(config('const.paginate.per_page'))->toArray();
  }

  /**
   * 詳細データを取得する
   *
   * @param int $sales_id 売上ID
   * @return array
   */
  public function get(int $sales_id)
  {
    $data = Sales::select(
      'sales.*',
      'users.name AS user_name',
      DB::raw('EXISTS(SELECT * FROM link_sales_invoice x WHERE x.sales_id = sales.id) AS has_invoice'),
      'link_r_order_sales.receive_order_id',
    )
      ->leftJoin('users', 'users.id', '=', 'sales.user_id')
      ->leftJoin('link_r_order_sales', 'link_r_order_sales.sales_id', '=', 'sales.id')
      ->where('sales.id', $sales_id)
      ->first()
      ->toArray();

    $data['details'] = $this->getDetails($sales_id);
    return $data;
  }

  /**
   * 受注データから詳細データを作成する
   *
   * @param int $receive_order_id 受注ID
   * @return array
   */
  public function get_by_receive_id(int $receive_order_id)
  {
    $query = ReceiveOrder::select(
      'receive_orders.*',
      'users.name AS user_name',
      'receive_order_has_sales.has_sales',
    )
      ->leftJoin('users', 'users.id', '=', 'receive_orders.user_id')
      ->leftJoin('receive_order_has_sales', 'receive_order_has_sales.receive_order_id', '=', 'receive_orders.id')
      ->where('receive_orders.id', $receive_order_id)
      ->first();

    $user = Auth::user();

    $details = $this->getDetailsByReceiveId($receive_order_id);
    $groups = ReceiveOrder::getSalesQuantityGroups($receive_order_id);
    $no = 1;
    foreach ($details as $d)
    {
      $id = $d->receive_order_detail_id;
      $d->no = $no++;
      if ($groups->has($id)) {
        $d->sales_quantity = $groups->get($id)->sum('s_quantity');
      } else {
        $d->sales_quantity = 0;
      }
      if ($d->quantity > $d->domestic_stock) {
        $d->quantity = $d->domestic_stock;
      }

      $d->quantity = $d->quantity - $d->sales_quantity;
      [$amount, $sales_tax] = calc_amount($d->unit_price, $d->quantity, $d->sales_tax_rate, $d->fraction);
      $d->amount = $amount;
      $d->sales_tax = $sales_tax;
    }

    $details_amount = $details->sum('amount');
    $shipping_amount = $query->shipping_amount ?? 0;
    $fee = $query->fee ?? 0;
    $discount = $query->discount ?? 0;
    $total_amount = calc_total_amount($shipping_amount, $fee, $discount, $details_amount);

    return [
      'sales_date' => Carbon::today()->format('Y/m/d'),
      'delivery_date' => $query->delivery_date,
      'customer_id' => $query->customer_id,
      'customer_name' => $query->customer_name,
      'send_flg' => $query->send_flg,
      'name' => $query->name,
      'zip_code' => $query->zip_code,
      'address1' => $query->address1,
      'address2' => $query->address2,
      'tel' => $query->tel,
      'fax' => $query->fax,
      'corporate_class' => $query->corporate_class,
      'user_id' => $user->id,
      'user_name' => $user->name,
      'shipping_amount' => $query->shipping_amount,
      'fee' => $query->fee,
      'discount' => $query->discount,
      'total_amount' => $total_amount,
      'order_no' => $query->order_no,
      'remarks' => $query->remarks,
      'rate' => $query->rate,
      'fraction' => $query->fraction,
      'details_amount' => $details_amount,
      'receive_order_id' => $query->id,
      'details' => $details->toArray(),
    ];
  }

  /**
   * 売上と連結している請求データがある場合はtrue
   *
   * @param int $sales_id 売上ID
   * @return bool
   */
  public function hasInvoice(int $sales_id)
  {
    return DB::table('link_sales_invoice')
      ->where('sales_id', $sales_id)
      ->count() > 0;
  }

  /**
   * 新規作成時のデータを作成する
   *
   * @return array
   */
  public function newData()
  {
    $m = new Sales();
    $m->sales_date = Carbon::today()->format('Y/m/d');
    $m->shipping_amount = null;
    $m->fee = null;
    $m->total_amount = null;
    $data = $m->toArray();

    $user = Auth::user();
    $data['user_id'] = $user->id;
    $data['user_name'] = $user->name;
    $data['details'] = [];

    return $data;
  }

  /**
   * 登録
   *
   * @param array $input 登録データ
   * @return array
   */
  public function store(array $input)
  {
    $data = new Collection($input);
    DB::beginTransaction();
    try {
      $m = Sales::create($data->toArray());
      $m->save();

      // 受注売上連結テーブルを登録する
      $receive_order_id = $data->get('receive_order_id');
      if ($receive_order_id) {
        $this->insertReceiveOrderSales($receive_order_id, $m->id);
      }

      // 明細を登録する
      $details = $data->get('details');
      $this->insertDetails($m->id, $details, $receive_order_id);

      if ($receive_order_id) {
        // sales_completedの更新
        $this->updateSalesCompleted($receive_order_id);

        // has_salesの更新
        $this->updateHasSales($receive_order_id);
      }

      // 入出庫データを登録する
      $this->insertInventoryMoves($m->id);

      // 国内在庫数を更新する
      $this->updateDomesticStock($m->id, []);

      DB::commit();
      return [
        'success' => true,
        'id' => $m->id,
      ];
    } catch (\Exception $ex) {
      DB::rollBack();
      throw $ex;
    }
  }

  /**
   * バリデーション（更新）
   *
   * @param int $sales_id 売上ID
   * @param array $input 更新データ
   * @return string
   */
  public function validate_edit(int $sales_id, array $input)
  {
    $data = new Collection($input);
    $m = Sales::find($sales_id);

    $customer_id = $data->get('customer_id');
    if ($customer_id) {
      $cm = Customer::find($customer_id);
      if ($cm->corporate_class !== $data->get('corporate_class')) {
        return "NG";
      }
    }
    return "OK";
  }

  /**
   * 更新
   *
   * @param int $sales_id 売上ID
   * @param array $input 更新データ
   * @return array
   */
  public function update(int $sales_id, array $input)
  {
    $data = new Collection($input);
    DB::beginTransaction();
    try {
      $m = Sales::find($sales_id);

      $pre_item_numbers = $m->getItemNumbers();

      $m->sales_date = $data->get('sales_date');
      $m->delivery_date = $data->get('delivery_date');
      $m->customer_id = $data->get('customer_id');
      $m->customer_name = $data->get('customer_name');
      $m->send_flg = $data->get('send_flg');
      $m->name = $data->get('name');
      $m->zip_code = $data->get('zip_code');
      $m->address1 = $data->get('address1');
      $m->address2 = $data->get('address2');
      $m->tel = $data->get('tel');
      $m->fax = $data->get('fax');
      $m->corporate_class = $data->get('corporate_class');
      $m->user_id = $data->get('user_id');
      $m->shipping_amount = $data->get('shipping_amount');
      $m->fee = $data->get('fee');
      $m->discount = $data->get('discount');
      $m->total_amount = $data->get('total_amount');
      $m->order_no = $data->get('order_no');
      $m->remarks = $data->get('remarks');
      $m->rate = $data->get('rate');
      $m->fraction = $data->get('fraction');
      $m->save();

      // 明細を更新する
      $details = $data->get('details');
      $this->updateDetails($sales_id, $details);

      $receive_order_id = $m->getReceiveOrderId();

      if ($receive_order_id) {
        // sales_completedの更新
        $this->updateSalesCompleted($receive_order_id);

        // has_salesの更新
        $this->updateHasSales($receive_order_id);
      }

      // 入出庫データを登録する
      $this->insertInventoryMoves($m->id);

      // 国内在庫数を更新する
      $this->updateDomesticStock($m->id, $pre_item_numbers);

      DB::commit();
      return [
        'success' => true,
      ];
    } catch (\Exception $ex) {
      DB::rollBack();
      throw $ex;
    }
  }

  /**
   * 削除
   *
   * @param int $sales_id 売上ID
   */
  public function delete(int $sales_id)
  {
    DB::transaction(function () use ($sales_id) {
      $m = Sales::find($sales_id);
      $receive_order_id = $m->getReceiveOrderId();
      $pre_item_numbers = $m->getItemNumbers();

      Sales::destroy($sales_id);

      if ($receive_order_id) {
        // sales_completedの更新
        $this->updateSalesCompleted($receive_order_id);

        // has_salesの更新
        $this->updateHasSales($receive_order_id);
      }

      // 国内在庫数を更新する
      $this->updateDomesticStock($m->id, $pre_item_numbers);
    });
  }

  /**
   * PDF用データを作成する
   *
   * @return array
   */
  public function getPdfData(array $input)
  {
    $data = $input;
    $input = new Collection($input);

    $configs = Config::getSelf();
    $data["config_data"] = $configs->toArray();

    $data["sales_tax_rate"] = $configs->getSalesTaxRate($input->get('sales_date'));

    $customer_id = $input->get('customer_id');
    if ($customer_id) {
      $customer = Customer::find($customer_id);
      $data["customer_data"] = $customer->toArray();
    }

    return $data;
  }

  /**
   * エクセル出力用のデータを取得する
   *
   * @param array $cond 検索条件
   * @return array
   */
  public function getExcelData(array $cond)
  {
    $query = Sales::select(
      'sales.id',
      'sales_date',
      'customer_name',
      'total_amount',
      'users.name AS user_name',
    );
    $query = $this->setCondition($query, $cond);
    $query->orderBy('sales_date', 'desc')
      ->orderBy('sales.id', 'desc');
      return $query->get();
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
    $query->leftJoin('users', 'users.id', '=', 'sales.user_id');

    $cond = new Collection($cond);
    $c_keyword = $cond->get('c_keyword');
    if ($c_keyword !== null && $c_keyword !== '') {
      $keywords = explode(" ", $c_keyword);
      foreach ($keywords as $key) {
        $query->where(function($query) use ($key) {
          $query->where('customer_name', 'like', '%' . escape_like($key) . '%')
            ->orWhere('users.name', 'like', '%' . escape_like($key) . '%');
        });
      }
    }

    $c_sales_date_from = $cond->get('c_sales_date_from');
    if ($c_sales_date_from) {
      $query->where('sales_date', '>=', $c_sales_date_from);
    }

    $c_sales_date_to = $cond->get('c_sales_date_to');
    if ($c_sales_date_to) {
      $query->where('sales_date', '<=', $c_sales_date_to);
    }

    $c_customer_name = $cond->get('c_customer_name');
    if ($c_customer_name) {
      $query->where('customer_name', 'like', '%' . escape_like($c_customer_name) . '%');
    }

    $c_customer_name = $cond->get('c_user_name');
    if ($c_customer_name) {
      $query->where('users.name', 'like', '%' . escape_like($c_customer_name) . '%');
    }

    $c_item_number = $cond->get('c_item_number');
    if ($c_item_number) {
      $query->whereExists(function ($q) use ($c_item_number) {
        $q->select(DB::raw(1))
          ->from('sales_details')
          ->whereRaw('sales_details.sales_id = sales.id')
          ->where('sales_details.item_number', 'like', '%' . escape_like($c_item_number) . '%');
      });
    }

    $c_name = $cond->get('c_name');
    if ($c_name) {
      $query->whereExists(function ($q) use ($c_name) {
        $q->select(DB::raw(1))
          ->from('sales_details')
          ->whereRaw('sales_details.sales_id = sales.id')
          ->where(function($q) use ($c_name) {
            $q->where('sales_details.item_name', 'like', '%' . escape_like($c_name) . '%')
              ->orWhere('sales_details.item_name_jp', 'like', '%' . escape_like($c_name) . '%');
          });
      });
    }

    $c_order_no = $cond->get('c_order_no');
    if ($c_order_no) {
      $query->where('order_no', 'like', '%' . escape_like($c_order_no) . '%');
    }

    return $query;
  }

  /**
   * 明細を取得する
   *
   * @param int $sales_id 売上ID
   * @return array
   */
  private function getDetails(int $sales_id)
  {
    return DB::table('sales_details')
      ->select(
        'sales_details.*',
      )
      ->where('sales_id', $sales_id)
      ->whereIn('item_kind', [1, 2])
      ->orderBy('sales_id')
      ->orderBy('no')
      ->get()
      ->toArray();
  }

  /**
   * 受注データの明細を取得する
   *
   * @param int $receive_order_id 受注ID
   * @return Collection
   */
  private function getDetailsByReceiveId(int $receive_order_id)
  {
    return DB::table('receive_order_details')
      ->join('items', 'items.id', '=', 'receive_order_details.item_id')
      ->select(
        'receive_order_details.id AS receive_order_detail_id',
        'receive_order_details.no',
        'receive_order_details.item_kind',
        'receive_order_details.item_id',
        'receive_order_details.item_number',
        'receive_order_details.item_name',
        'receive_order_details.item_name_jp',
        'receive_order_details.sales_unit_price',
        'receive_order_details.rate',
        'receive_order_details.fraction',
        'receive_order_details.unit_price',
        'receive_order_details.quantity',
        'receive_order_details.amount',
        'receive_order_details.sales_tax_rate',
        'receive_order_details.sales_tax',
        'items.domestic_stock',
      )
      ->where('receive_order_details.receive_order_id', $receive_order_id)
      ->whereIn('receive_order_details.item_kind', [1, 2])
      ->where('receive_order_details.sales_completed', '<>', 1)
      // ->whereColumn('receive_order_details.quantity', '<=', 'items.domestic_stock')
      ->where('items.domestic_stock', '<>', 0)
      ->orderBy('receive_order_details.receive_order_id')
      ->orderBy('receive_order_details.no')
      ->get();
  }

  /**
   * 明細を登録する
   *
   * @param int $sales_id 売上ID
   * @param mixed $details 明細データ
   * @param int|null $receive_order_id 受注ID
   */
  private function insertDetails(int $sales_id, $details, $receive_order_id)
  {
    if ($details) {
      foreach ($details as $detail) {
        $detail = new Collection($detail);

        $this->createDetailItems($sales_id, $detail, $receive_order_id);
      }
    }
  }

  /**
   * 明細を更新する
   *
   * @param int $sales_id 売上ID
   * @param mixed $details 明細データ
   */
  private function updateDetails(int $sales_id, $details)
  {
    // 削除された明細をDBから削除する
    $this->deleteDetails($sales_id, $details);

    if ($details) {
      foreach ($details as $detail) {
        $detail = new Collection($detail);
        $id = $detail->get('id');

        // 明細IDが存在する場合は更新、しない場合は登録する
        if ($id) {
          $this->updateDetailItems($id, $sales_id, $detail);
        } else {
          $this->createDetailItems($sales_id, $detail);
        }
      }
    }
  }

  /**
   * 明細を生成する
   *
   * @param int $sales_id 売上ID
   * @param Collection $detail 明細データ
   * @param int|null $receive_order_id 受注ID
   */
  private function createDetailItems(
    int $sales_id,
    $detail,
    $receive_order_id = null
  ) {
    $item_kind = $detail->get('item_kind');
    $item_id = $detail->get('item_id');

    $m = SalesDetail::create([
      'id' => null,
      'sales_id' => $sales_id,
      'no' => $detail->get('no'),
      'item_kind' => $item_kind,
      'item_id' => $item_id,
      'item_number' => $detail->get('item_number'),
      'item_name' => $detail->get('item_name'),
      'item_name_jp' => $detail->get('item_name_jp'),
      'sales_unit_price' => $detail->get('sales_unit_price'),
      'fraction' => $detail->get('fraction'),
      'rate' => $detail->get('rate'),
      'unit_price' => $detail->get('unit_price'),
      'quantity' => $detail->get('quantity'),
      'amount' => $detail->get('amount'),
      'sales_tax_rate' => $detail->get('sales_tax_rate'),
      'sales_tax' => $detail->get('sales_tax'),
    ]);

    // 受注売上明細連結テーブルを登録する
    if ($receive_order_id) {
      $this->insertReceiveOrderDetailSalesDetail($detail->get('receive_order_detail_id'), $m->id);
    }

    // セット品の場合、セット品の明細を登録する
    if ($item_kind === 2) {
      $this->createSetItems($m);
    }
  }

  /**
   * 明細を更新する
   *
   * @param int $id 売上明細ID
   * @param int $sales_id 売上ID
   * @param Collection $detail 明細データ
   */
  private function updateDetailItems(int $id, int $sales_id, $detail) {
    $item_kind = $detail->get('item_kind');

    $m = SalesDetail::find($id);
    $prev = clone $m;

    $m->sales_id = $sales_id;
    $m->no = $detail->get('no');
    $m->item_kind = $item_kind;
    $m->item_id = $detail->get('item_id');
    $m->item_number = $detail->get('item_number');
    $m->item_name = $detail->get('item_name');
    $m->item_name_jp = $detail->get('item_name_jp');
    $m->sales_unit_price = $detail->get('sales_unit_price');
    $m->fraction = $detail->get('fraction');
    $m->rate = $detail->get('rate');
    $m->unit_price = $detail->get('unit_price');
    $m->quantity = $detail->get('quantity');
    $m->amount = $detail->get('amount');
    $m->sales_tax_rate = $detail->get('sales_tax_rate');
    $m->sales_tax = $detail->get('sales_tax');
    $m->save();

    // セット品の場合、セット品の明細を登録する
    if ($item_kind === 2) {
      if ($prev->item_id != $m->item_id) {
        // 商品IDが変わった場合、セット品の明細を削除する
        DB::table('sales_details')->where('parent_id', $id)->delete();
        $this->createSetItems($m);

      } else if ($prev->quantity != $m->quantity) {
        // 数量が変わった場合、セット品の明細を更新する
        $this->updateSetItems($m);
      }
    }

  }

  /**
   * セット品の明細を生成する
   *
   * @param EstimateDetail $parent 親データ
   */
  private function createSetItems($parent) {
    $items = Item::getSetItems($parent->item_id);
    $data = [];
    foreach ($items as $item) {
      $sales_unit_price = $item->set_price;
      $rate = $parent->rate;
      $unit_price = calc_unit_price($sales_unit_price, $rate, $parent->fraction);
      $quantity = $item->quantity * $parent->quantity;
      [$amount, $sales_tax] = calc_amount($unit_price, $quantity, $parent->sales_tax_rate, $parent->fraction);

      $data[] = [
        'id' => null,
        'sales_id' => $parent->sales_id,
        'no' => 0,
        'item_kind' => 3,
        'item_id' => $item->id,
        'item_number' => $item->item_number,
        'item_name' => $item->name,
        'item_name_jp' => $item->name_jp,
        'sales_unit_price' => $item->sales_unit_price,
        'fraction' => $parent->fraction,
        'rate' => $rate,
        'unit_price' => $unit_price,
        'quantity' => $quantity,
        'amount' => $amount,
        'sales_tax_rate' => $parent->sales_tax_rate,
        'sales_tax' => $sales_tax,
        'parent_id' => $parent->id,
      ];
    }
    DB::table('sales_details')->insert($data);
  }

  /**
   * セット品の明細を更新する
   *
   * @param SalesDetail $parent 親の明細データ
   */
  private function updateSetItems($parent) {
    $details = SalesDetail::select([
      'sales_details.id',
      'set_item_details.quantity',
    ])
      ->join('set_item_details', 'set_item_details.id', '=', 'sales_details.item_id')
      ->where('parent_id', $parent->id)
      ->where('set_item_id', $parent->item_id)
      ->get();

    foreach ($details as $d) {
      $sales_unit_price = $d->set_price;
      $rate = $parent->rate;
      $unit_price = calc_unit_price($sales_unit_price, $rate, $parent->fraction);
      $quantity = $d->quantity * $parent->quantity;
      [$amount, $sales_tax] = calc_amount($unit_price, $quantity, $parent->sales_tax_rate, $parent->fraction);

      DB::table('sales_details')
        ->where('id', $d->id)
        ->update([
          'rate' => $rate,
          'unit_price' => $unit_price,
          'quantity' => $quantity,
          'amount' => $amount,
          'sales_tax' => $sales_tax
        ]);
    }
  }

  /**
   * 削除された明細をDBから削除する
   *
   * @param int $sales_id 売上ID
   * @param mixed $details 明細データ
   */
  private function deleteDetails(int $sales_id, $details) {
    $prevIds = $this->getPrevDetailIds($sales_id);
    $currentIds = Arr::pluck($details, 'id');

    // 変更前のIDと更新されたIDの差分を取得する
    $deleteIds = array_diff($prevIds, $currentIds);

    DB::table('sales_details')
      ->whereIn('id', $deleteIds)
      ->delete();
  }

  /**
   * 変更前の明細のIDの配列を取得する
   *
   * @param int $sales_id 売上ID
   * @return array
   */
  private function getPrevDetailIds(int $sales_id) {
    $data =  DB::table('sales_details')
      ->where('sales_id', $sales_id)
      ->whereIn('item_kind', [1, 2])
      ->pluck('id')
      ->toArray();
    return $data;
  }

  /**
   * 受注売上連結テーブルを登録する
   *
   * @param int $receive_order_id 受注ID
   * @param int $sales_id 売上ID
   */
  private function insertReceiveOrderSales(int $receive_order_id, int $sales_id) {
    DB::table('link_r_order_sales')->insert([
      ['receive_order_id' => $receive_order_id, 'sales_id' => $sales_id]
    ]);
  }

  /**
   * 受注売上明細連結テーブルを登録する
   *
   * @param int $receive_order_detail_id 受注明細ID
   * @param int $sales_detail_id 売上明細ID
   */
  private function insertReceiveOrderDetailSalesDetail($receive_order_detail_id, int $sales_detail_id) {
    if ($receive_order_detail_id) {
      DB::table('link_r_order_sales_detail')->insert([
        ['receive_order_detail_id' => $receive_order_detail_id, 'sales_detail_id' => $sales_detail_id]
      ]);
    }
  }

  /**
   * sales_completedの更新
   *
   * @param int $receive_order_id 受注ID
   */
  private function updateSalesCompleted(int $receive_order_id)
  {
    DB::update("UPDATE receive_order_details AS rd LEFT JOIN (SELECT x.receive_order_detail_id, sum(y.quantity) AS quantity FROM link_r_order_sales_detail x INNER JOIN sales_details y ON y.id = x.sales_detail_id GROUP BY x.receive_order_detail_id) AS sd ON sd.receive_order_detail_id = rd.id
      SET sales_completed = CASE WHEN rd.quantity <= sd.quantity THEN 1 ELSE 0 END
      WHERE rd.receive_order_id = ?", [$receive_order_id]);
  }

  /**
   * has_salesの更新
   *
   * @param int $receive_order_id 受注ID
   */
  private function updateHasSales(int $receive_order_id)
  {
    $has_sales = 0;

    $rows = DB::table('receive_orders as r')
      ->select([
        'rd.id as receive_detail_id',
        'rd.quantity as r_quantity',
        'sd.quantity as s_quantity',
      ])
      ->join('receive_order_details as rd', 'rd.receive_order_id', '=', 'r.id')
      ->leftJoin('link_r_order_sales_detail as l', 'l.receive_order_detail_id', '=', 'rd.id')
      ->leftJoin('sales_details as sd', 'sd.id', '=', 'l.sales_detail_id')
      ->where('r.id', '=', $receive_order_id)
      ->whereIn('rd.item_kind', [1, 2])
      ->get();

    if ($rows->sum('s_quantity') > 0) {
      $groups = $rows->groupBy('receive_detail_id');
      foreach ($groups as $g) {
        $has_sales = 1;
        $r_quantity = $g->first()->r_quantity;
        $s_quantity = $g->sum('s_quantity');
        if ($r_quantity > $s_quantity) {
          $has_sales = 2;
          break;
        }
      }
    }

    DB::table('receive_order_has_sales')->updateOrInsert([
      'receive_order_id' => $receive_order_id,
    ], [
      'has_sales' => $has_sales
    ]);
  }

  /**
   * 入出庫データを登録する
   *
   * @param int $sales_id
   */
  private function insertInventoryMoves(int $sales_id)
  {
    DB::table('inventory_moves')->where('sales_id', '=', $sales_id)->delete();
    DB::insert("INSERT INTO inventory_moves (job_date
      , detail_kind
      , sales_id
      , item_number
      , quantity
      , created_at)
    SELECT s.sales_date
      , 2
      , s.id
      , d.item_number
      , d.quantity
      , CURRENT_TIMESTAMP
    FROM sales s INNER JOIN sales_details d ON d.sales_id = s.id
    WHERE s.id = :id AND d.item_kind <> 2 ", ['id' => $sales_id]);
  }

  /**
   * 国内在庫数を更新する
   *
   * @param int $sales_id
   * @param array $pre_item_numbers
   */
  private function updateDomesticStock(int $sales_id, array $pre_item_numbers)
  {
    $m = Sales::find($sales_id);
    $item_numbers = $m ? $m->getItemNumbers() : [];

    $numbers = $pre_item_numbers + $item_numbers;

    // 最新の在庫を取得する
    $latests = Inventory::getLatestInventories($numbers);

    foreach ($numbers as $number) {
      $import_month = "";
      $quantity = 0;

      $l = $latests->get($number);
      if ($l) {
        $l = $l->first();
        $import_month = $l->import_month;
        $import_month = add_month($import_month);
        $quantity = $l->quantity;
      }

      $move_quantity = InventoryMove::getQuantity($import_month, $number);

      Item::where('item_number', $number)
        ->update(['domestic_stock' => $quantity + $move_quantity]);
    }
  }
}
