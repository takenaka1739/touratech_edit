<?php
// 更新: app/Api/ReceiveOrder/Services/ReceiveOrderService.php

namespace App\Api\ReceiveOrder\Services;

use App\Base\Models\Config;
use App\Base\Models\Customer;
use App\Base\Models\Item;
use App\Base\Models\ReceiveOrder;
use App\Base\Models\ReceiveOrderDetail;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * 受注データサービス
 */
class ReceiveOrderService
{
  public function dialog(array $cond)
  {
    $query = ReceiveOrder::select(
      't_receive_orders.id',
      'receive_order_date',
      'customer_name',
      'total_amount',
      'm_personnels.name AS user_name',
      'receive_order_has_sales.has_sales',
    );
    $query = $this->setCondition($query, $cond);
    $query->orderBy('receive_order_date', 'desc')
      ->orderBy('t_receive_orders.id', 'desc');
    return $query->paginate(config('const.paginate.per_page'))->toArray();
  }

  public function fetch(array $cond)
  {
    $query = ReceiveOrder::select(
      't_receive_orders.id',
      'receive_order_date',
      'customer_name',
      'total_amount',
      'm_personnels.name AS user_name',
      'receive_order_has_sales.has_sales',
    );
    $query = $this->setCondition($query, $cond);
    $query->orderBy('receive_order_date', 'desc')
      ->orderBy('t_receive_orders.id', 'desc');
    return $query->paginate(config('const.paginate.per_page'))->toArray();
  }

  public function get(int $receive_order_id)
  {
    $row = ReceiveOrder::select(
      't_receive_orders.*',
      'm_personnels.name AS user_name',
      // ★統一：t_link_estimate_receive_order
      't_link_estimate_receive_order.estimate_id',
      'receive_order_has_sales.has_sales',
      't_receive_order_has_p_order.has_p_order as has_place',
    )
      ->leftJoin('m_personnels', 'm_personnels.id', '=', 't_receive_orders.user_id')
      ->leftJoin('t_link_estimate_receive_order', 't_link_estimate_receive_order.receive_order_id', '=', 't_receive_orders.id')
      ->leftJoin('receive_order_has_sales', 'receive_order_has_sales.receive_order_id', '=', 't_receive_orders.id')
      ->leftJoin('t_receive_order_has_p_order', 't_receive_order_has_p_order.receive_order_id', '=', 't_receive_orders.id')
      ->where('t_receive_orders.id', $receive_order_id)
      ->first();

    if (!$row) {
      return [];
    }

    $data = $row->toArray();
    $data['details'] = $this->getDetails($receive_order_id);
    $data['square_card'] = $this->getSquareCard($row->customer_payment_id ?? null);
    $data['square_payment_attempts'] = $this->getSquarePaymentAttempts($receive_order_id);

    return $data;
  }

  private function getSquareCard($customer_payment_id): ?array
  {
    if (!$customer_payment_id || !Schema::hasTable('t_customer_payments')) {
      return null;
    }

    $row = DB::table('t_customer_payments')
      ->select([
        'id',
        'card_company',
        'last_four_digit',
        'month',
        'year',
        'account_name',
      ])
      ->where('id', $customer_payment_id)
      ->whereNull('deleted_at')
      ->first();

    if (!$row) {
      return null;
    }

    return [
      'id' => (int)$row->id,
      'brand' => $row->card_company,
      'last4' => $row->last_four_digit,
      'expiry' => sprintf('%02d/%04d', (int)$row->month, (int)$row->year),
      'account_name' => $row->account_name,
    ];
  }

  private function getSquarePaymentAttempts(int $receive_order_id): array
  {
    if (!Schema::hasTable('t_receive_order_square_payment_attempts')) {
      return [];
    }

    return DB::table('t_receive_order_square_payment_attempts')
      ->select([
        'id',
        'square_payment_id',
        'square_status',
        'amount',
        'currency',
        'error_code',
        'error_message',
        'attempted_at',
      ])
      ->where('receive_order_id', $receive_order_id)
      ->orderByDesc('attempted_at')
      ->orderByDesc('id')
      ->limit(5)
      ->get()
      ->map(fn($row) => [
        'id' => (int)$row->id,
        'square_payment_id' => $row->square_payment_id,
        'square_status' => $row->square_status,
        'amount' => $row->amount !== null ? (float)$row->amount : null,
        'currency' => $row->currency,
        'error_code' => $row->error_code,
        'error_message' => $row->error_message,
        'attempted_at' => $row->attempted_at,
      ])
      ->all();
  }

  public function newData()
  {
    $m = new ReceiveOrder();
    $m->receive_order_date = Carbon::today()->format('Y/m/d');
    $m->shipping_amount = null;
    $m->additional_shipping_amount = null;
    $m->fee = null;
    $m->total_amount = null;
    $data = $m->toArray();

    $user = Auth::user();
    $data['user_id'] = $user->id;
    $data['user_name'] = $user->name;
    $data['details'] = [];

    return $data;
  }

  public function hasSales(int $receive_order_id)
  {
    return DB::table('t_link_r_order_sales')
      ->where('receive_order_id', $receive_order_id)
      ->count() > 0;
  }

  public function store(array $input)
  {
    $data = $this->prepareHeaderData(new Collection($input));

    $id = DB::transaction(function () use ($data) {
      $m = ReceiveOrder::create($data->toArray());

      $estimate_id = $data->get('estimate_id');
      if ($estimate_id) {
        $this->insertEstimateReceiveOrder($estimate_id, $m->id);
      }

      $details = $data->get('details');
      $this->insertDetails($m->id, $details, $estimate_id);

      return $m->id;
    });

    return $this->get($id);
  }

  public function update(int $receive_order_id, array $input)
  {
    $data = $this->prepareHeaderData(new Collection($input));

    DB::transaction(function () use ($receive_order_id, $data) {
      $m = ReceiveOrder::find($receive_order_id);
      $m->receive_order_date = $data->get('receive_order_date');
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
      if (Schema::hasColumn('t_receive_orders', 'additional_shipping_amount')) {
        $m->additional_shipping_amount = $data->get('additional_shipping_amount');
      }
      $m->fee = $data->get('fee');
      $m->discount = $data->get('discount');
      $m->total_amount = $data->get('total_amount');
      $m->order_no = $data->get('order_no');
      $m->remarks = $data->get('remarks');
      $m->rate = $data->get('rate');
      $m->fraction = $data->get('fraction');
      $m->save();

      $details = $data->get('details');
      $this->updateDetails($receive_order_id, $details);
    });

    return $this->get($receive_order_id);
  }

  private function prepareHeaderData(Collection $data): Collection
  {
    if (!Schema::hasColumn('t_receive_orders', 'additional_shipping_amount')) {
      $data->forget('additional_shipping_amount');
    }

    return $data;
  }

  public function validate_delete(int $receive_order_id)
  {
    $has_place = DB::table('t_link_r_order_p_order')
      ->where('receive_order_id', '=', $receive_order_id)
      ->exists();

    return $has_place ? "NG" : "OK";
  }

  public function delete(int $receive_order_id)
  {
    DB::transaction(function () use ($receive_order_id) {
      ReceiveOrder::destroy($receive_order_id);
    });
  }

  public function getPdfData(array $data)
  {
    $config = Config::getSelf();
    $data['config_data'] = $config->toArray();
    $data['user_name'] = Auth::user()?->name ?? ($data['user_name'] ?? '');

    $customer = Customer::find($data['customer_id']);
    $data['customer_bank_class'] = $customer ? $customer->bank_class : 1;

    return $data;
  }

  private function setCondition($query, array $cond)
  {
    $query->leftJoin('m_personnels', 'm_personnels.id', '=', 't_receive_orders.user_id')
      ->leftJoin('receive_order_has_sales', 'receive_order_has_sales.receive_order_id', '=', 't_receive_orders.id');

    $cond = new Collection($cond);

    $from = $cond->get('c_receive_order_date_from');
    if ($from) {
      $query->where('receive_order_date', '>=', $from);
    }

    $to = $cond->get('c_receive_order_date_to');
    if ($to) {
      $query->where('receive_order_date', '<=', $to);
    }

    $c_customer_name = $cond->get('c_customer_name');
    if ($c_customer_name) {
      $query->where('customer_name', 'like', '%' . escape_like($c_customer_name) . '%');
    }

    // ★変数名を正常化（旧コード由来の上書きを排除）
    $c_user_name = $cond->get('c_user_name');
    if ($c_user_name) {
      $query->where('m_personnels.name', 'like', '%' . escape_like($c_user_name) . '%');
    }

    $c_item_number = $cond->get('c_item_number');
    if ($c_item_number) {
      $query->whereExists(function ($q) use ($c_item_number) {
        $q->select(DB::raw(1))
          ->from('t_receive_order_details')
          ->whereRaw('t_receive_order_details.receive_order_id = t_receive_orders.id')
          ->where('t_receive_order_details.item_number', 'like', '%' . escape_like($c_item_number) . '%');
      });
    }

    $c_name = $cond->get('c_name');
    if ($c_name) {
      $query->whereExists(function ($q) use ($c_name) {
        $q->select(DB::raw(1))
          ->from('t_receive_order_details')
          ->whereRaw('t_receive_order_details.receive_order_id = t_receive_orders.id')
          ->where(function ($q) use ($c_name) {
            $q->where('t_receive_order_details.item_name', 'like', '%' . escape_like($c_name) . '%')
              ->orWhere('t_receive_order_details.item_name_jp', 'like', '%' . escape_like($c_name) . '%');
          });
      });
    }

    $c_order_no = $cond->get('c_order_no');
    if ($c_order_no) {
      $query->where('order_no', 'like', '%' . escape_like($c_order_no) . '%');
    }

    return $query;
  }

  private function getDetails(int $receive_order_id)
  {
    $salesQuantityGroups = ReceiveOrder::getSalesQuantityGroups($receive_order_id);

    return DB::table('t_receive_order_details')
      ->select([
        't_receive_order_details.*',
        'm_items.purchase_unit_price',
        'm_items.shipping_pay',
        'm_items.is_shipping_fee',
        'm_items.additional_shipping_fee',
      ])
      ->join('m_items', 'm_items.id', '=', 't_receive_order_details.item_id')
      ->where('receive_order_id', $receive_order_id)
      ->whereIn('item_kind', [1, 2])
      ->orderBy('receive_order_id')
      ->orderBy('no')
      ->get()
      ->map(function ($detail) use ($salesQuantityGroups) {
        $group = $salesQuantityGroups->get($detail->id);
        $salesQuantity = $group ? (int) $group->sum('s_quantity') : 0;

        $detail->sales_quantity = $salesQuantity;
        $detail->is_sales_registered = $salesQuantity > 0;

        return $detail;
      })
      ->toArray();
  }

  private function insertDetails(int $receive_order_id, $details, $estimate_id)
  {
    if ($details) {
      foreach ($details as $detail) {
        $detail = new Collection($detail);
        $this->createDetailItems($receive_order_id, $detail);
      }
    }
  }

  private function updateDetails(int $receive_order_id, $details)
  {
    $this->deleteDetails($receive_order_id, $details);

    if ($details) {
      foreach ($details as $detail) {
        $detail = new Collection($detail);
        $id = $detail->get('id');

        if ($id) {
          $this->updateDetailItems($id, $receive_order_id, $detail);
        } else {
          $this->createDetailItems($receive_order_id, $detail);
        }
      }
    }
  }

  private function createDetailItems(int $receive_order_id, $detail)
  {
    $item_kind = $detail->get('item_kind');
    $item_id = $detail->get('item_id');

    // ★discount 正規化（新仕様）
    $detail_discount = (int) ($detail->get('discount') ?? 0);

    $m = ReceiveOrderDetail::create([
      'id' => null,
      'receive_order_id' => $receive_order_id,
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
      'discount' => $detail_discount,
      'amount' => $detail->get('amount'),
      'sales_tax_rate' => $detail->get('sales_tax_rate'),
      'sales_tax' => $detail->get('sales_tax'),
      'answer_date' => $detail->get('answer_date'),
    ]);

    if ($item_kind === 2) {
      $this->createSetItems($m);
    }
  }

  private function updateDetailItems(int $id, int $receive_order_id, $detail)
  {
    $item_kind = $detail->get('item_kind');

    $m = ReceiveOrderDetail::find($id);
    $prev = clone $m;

    $detail_discount = (int) ($detail->get('discount') ?? 0);

    $m->receive_order_id = $receive_order_id;
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
    $m->discount = $detail_discount;
    $m->amount = $detail->get('amount');
    $m->sales_tax_rate = $detail->get('sales_tax_rate');
    $m->sales_tax = $detail->get('sales_tax');
    $m->answer_date = $detail->get('answer_date');
    $m->save();

    if ($item_kind === 2) {
      if ($prev->item_id != $m->item_id) {
        DB::table('t_receive_order_details')->where('parent_id', $id)->delete();
        $this->createSetItems($m);
      } else if ($prev->quantity != $m->quantity) {
        $this->updateSetItems($m);
      }
    }
  }

  private function createSetItems($parent)
  {
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
        'receive_order_id' => $parent->receive_order_id,
        'no' => 0,
        'item_kind' => 3,
        'item_id' => $item->id,
        'item_number' => $item->item_number,
        'item_name' => $item->name,
        'item_name_jp' => $item->name_jp,
        'sales_unit_price' => $sales_unit_price,
        'fraction' => $parent->fraction,
        'rate' => $rate,
        'unit_price' => $unit_price,
        'quantity' => $quantity,
        'discount' => 0,
        'amount' => $amount,
        'sales_tax_rate' => $parent->sales_tax_rate,
        'sales_tax' => $sales_tax,
        'parent_id' => $parent->id,
      ];
    }

    DB::table('t_receive_order_details')->insert($data);
  }

  private function updateSetItems($parent)
  {
    // ★バグ修正：set_price を select に含める
    $details = ReceiveOrderDetail::select([
      't_receive_order_details.id',
      't_set_item_details.set_price',
      't_set_item_details.quantity',
    ])
      ->join('t_set_item_details', 't_set_item_details.id', '=', 't_receive_order_details.item_id')
      ->where('parent_id', $parent->id)
      ->where('set_item_id', $parent->item_id)
      ->get();

    foreach ($details as $d) {
      $sales_unit_price = $d->set_price;
      $rate = $parent->rate;
      $unit_price = calc_unit_price($sales_unit_price, $rate, $parent->fraction);
      $quantity = $d->quantity * $parent->quantity;
      [$amount, $sales_tax] = calc_amount($unit_price, $quantity, $parent->sales_tax_rate, $parent->fraction);

      DB::table('t_receive_order_details')
        ->where('id', $d->id)
        ->update([
          'rate' => $rate,
          'unit_price' => $unit_price,
          'quantity' => $quantity,
          'discount' => 0,
          'amount' => $amount,
          'sales_tax' => $sales_tax,
        ]);
    }
  }

  private function deleteDetails(int $receive_order_id, $details)
  {
    $prevIds = $this->getPrevDetailIds($receive_order_id);
    $currentIds = Arr::pluck($details, 'id');
    $deleteIds = array_diff($prevIds, $currentIds);

    if (empty($deleteIds)) {
      return;
    }

    DB::table('t_receive_order_details')
      ->whereIn('id', $deleteIds)
      ->delete();
  }

  private function getPrevDetailIds(int $receive_order_id)
  {
    return DB::table('t_receive_order_details')
      ->where('receive_order_id', $receive_order_id)
      ->whereIn('item_kind', [1, 2])
      ->pluck('id')
      ->toArray();
  }

  private function insertEstimateReceiveOrder(int $estimate_id, int $receive_order_id)
  {
    // ★統一：t_link_estimate_receive_order
    DB::table('t_link_estimate_receive_order')->insert([
      ['estimate_id' => $estimate_id, 'receive_order_id' => $receive_order_id]
    ]);
  }
}
