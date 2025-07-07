<?php

namespace App\Api\ReceiveOrder\Services;

use App\Base\Models\Config;
use App\Base\Models\Customer;
use App\Base\Models\EstimateDetail;
use App\Base\Models\Item;
use App\Base\Models\ReceiveOrder;
use App\Base\Models\ReceiveOrderDetail;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/**
 * 受注データサービス
 */
class ReceiveOrderService
{
  /**
   * 検索画面用の一覧データを取得する
   *
   * @param array $cond 検索条件
   * @return array
   */
  public function dialog(array $cond)
  {
    $query = ReceiveOrder::select(
      'receive_orders.id',
      'receive_order_date',
      'customer_name',
      'total_amount',
      'users.name AS user_name',
      'receive_order_has_sales.has_sales',
    );
    $query = $this->setCondition($query, $cond);
    $query->orderBy('receive_order_date', 'desc')
      ->orderBy('receive_orders.id', 'desc');
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
    $query = ReceiveOrder::select(
      'receive_orders.id',
      'receive_order_date',
      'customer_name',
      'total_amount',
      'users.name AS user_name',
      'receive_order_has_sales.has_sales',
    );
    $query = $this->setCondition($query, $cond);
    $query->orderBy('receive_order_date', 'desc')
      ->orderBy('receive_orders.id', 'desc');
    return $query->paginate(config('const.paginate.per_page'))->toArray();
  }

  /**
   * 詳細データを取得する
   *
   * @param int $receive_order_id 受注ID
   * @return array
   */
  public function get(int $receive_order_id)
  {
    $data = ReceiveOrder::select(
      'receive_orders.*',
      'users.name AS user_name',
      'link_estimate_receive_order.estimate_id',
      'receive_order_has_sales.has_sales',
      'receive_order_has_p_order.has_p_order as has_place',
    )
      ->leftJoin('users', 'users.id', '=', 'receive_orders.user_id')
      ->leftJoin('link_estimate_receive_order', 'link_estimate_receive_order.receive_order_id', '=', 'receive_orders.id')
      ->leftJoin('receive_order_has_sales', 'receive_order_has_sales.receive_order_id', '=', 'receive_orders.id')
      ->leftJoin('receive_order_has_p_order', 'receive_order_has_p_order.receive_order_id', '=', 'receive_orders.id')
      ->where('receive_orders.id', $receive_order_id)
      ->first()
      ->toArray();

    $data['details'] = $this->getDetails($receive_order_id);
    return $data;
  }

  /**
   * 新規作成時のデータを作成する
   *
   * @return array
   */
  public function newData()
  {
    $m = new ReceiveOrder();
    $m->receive_order_date = Carbon::today()->format('Y/m/d');
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
   * 受注と連結している売上データがある場合はtrue
   *
   * @param int $receive_order_id
   * @return bool
   */
  public function hasSales(int $receive_order_id)
  {
    return DB::table('link_r_order_sales')
      ->where('receive_order_id', $receive_order_id)
      ->count() > 0;
  }

  /**
   * 登録
   *
   * @param array $input 登録データ
   */
  public function store(array $input)
  {
    $data = new Collection($input);
    return DB::transaction(function () use ($data) {
      $m = ReceiveOrder::create($data->toArray());

      // 見積受注連結テーブルを登録する
      $estimate_id = $data->get('estimate_id');
      if ($estimate_id) {
        $this->insertEstimateReceiveOrder($estimate_id, $m->id);
      }

      // 明細を登録する
      $details = $data->get('details');
      $this->insertDetails($m->id, $details, $estimate_id);

      return $m->id;
    });
  }

  /**
   * 更新
   *
   * @param int $receive_order_id 受注ID
   * @param array $input 更新データ
   */
  public function update(int $receive_order_id, array $input)
  {
    $data = new Collection($input);
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
      $this->updateDetails($receive_order_id, $details);
    });
  }

  /**
   * バリデーション（削除）
   *
   * @param int $receive_order_id 受注ID
   * @return string
   */
  public function validate_delete(int $receive_order_id)
  {
    $has_place = DB::table('link_r_order_p_order')
      ->where('receive_order_id', '=', $receive_order_id)
      ->exists();

    if ($has_place) {
      return "NG";
    }
    return "OK";
  }

  /**
   * 削除
   *
   * @param int $receive_order_id 受注ID
   */
  public function delete(int $receive_order_id)
  {
    DB::transaction(function () use ($receive_order_id) {
      ReceiveOrder::destroy($receive_order_id);
    });
  }

  /**
   * PDF用データを作成する
   *
   * @param array $data
   * @return array
   */
  public function getPdfData(array $data)
  {
    $config = Config::getSelf();
    $data['config_data'] = $config->toArray();

    $customer = Customer::find($data['customer_id']);
    if ($customer) {
      $data['customer_bank_class'] = $customer->bank_class;
    } else {
      $data['customer_bank_class'] = 1;
    }

    return $data;
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
    $query->leftJoin('users', 'users.id', '=', 'receive_orders.user_id')
      ->leftJoin('receive_order_has_sales', 'receive_order_has_sales.receive_order_id', '=', 'receive_orders.id');

    $cond = new Collection($cond);

    $c_receive_order_date_from = $cond->get('c_receive_order_date_from');
    if ($c_receive_order_date_from) {
      $query->where('receive_order_date', '>=', $c_receive_order_date_from);
    }

    $c_receive_order_date_to = $cond->get('c_receive_order_date_to');
    if ($c_receive_order_date_to) {
      $query->where('receive_order_date', '<=', $c_receive_order_date_to);
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
          ->from('receive_order_details')
          ->whereRaw('receive_order_details.receive_order_id = receive_orders.id')
          ->where('receive_order_details.item_number', 'like', '%' . escape_like($c_item_number) . '%');
        });
    }

    $c_name = $cond->get('c_name');
    if ($c_name) {
      $query->whereExists(function ($q) use ($c_name) {
        $q->select(DB::raw(1))
          ->from('receive_order_details')
          ->whereRaw('receive_order_details.receive_order_id = receive_orders.id')
          ->where(function($q) use ($c_name) {
            $q->where('receive_order_details.item_name', 'like', '%' . escape_like($c_name) . '%')
              ->orWhere('receive_order_details.item_name_jp', 'like', '%' . escape_like($c_name) . '%');
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
   * @param int $receive_order_id 受注ID
   * @return array
   */
  private function getDetails(int $receive_order_id)
  {
    return DB::table('receive_order_details')
      ->select([
        'receive_order_details.*',
        'items.purchase_unit_price',
      ])
      ->join('items', 'items.id', '=', 'receive_order_details.item_id')
      ->where('receive_order_id', $receive_order_id)
      ->whereIn('item_kind', [1, 2])
      ->orderBy('receive_order_id')
      ->orderBy('no')
      ->get()
      ->toArray();
  }

  /**
   * 明細を登録する
   *
   * @param int $receive_order_id 受注ID
   * @param mixed $details 明細データ
   * @param int|null $estimate_id 見積ID
   */
  private function insertDetails(int $receive_order_id, $details, $estimate_id)
  {
    if ($details) {
      foreach ($details as $detail) {
        $detail = new Collection($detail);

        $this->createDetailItems($receive_order_id, $detail);
      }
    }
  }

  /**
   * 明細を更新する
   *
   * @param int $receive_order_id 受注ID
   * @param mixed $details 明細データ
   */
  private function updateDetails(int $receive_order_id, $details)
  {
    // 削除された明細をDBから削除する
    $this->deleteDetails($receive_order_id, $details);

    if ($details) {
      foreach ($details as $detail) {
        $detail = new Collection($detail);
        $id = $detail->get('id');

        // 明細IDが存在する場合は更新、しない場合は登録する
        if ($id) {
          $this->updateDetailItems($id, $receive_order_id, $detail);
        } else {
          $this->createDetailItems($receive_order_id, $detail);
        }
      }
    }
  }

  /**
   * 明細を生成する
   *
   * @param int $receive_order_id 受注ID
   * @param Collection $detail 明細データ
   */
  private function createDetailItems(
    int $receive_order_id,
    $detail
  ) {
    $item_kind = $detail->get('item_kind');
    $item_id = $detail->get('item_id');

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
      'amount' => $detail->get('amount'),
      'sales_tax_rate' => $detail->get('sales_tax_rate'),
      'sales_tax' => $detail->get('sales_tax'),
      'answer_date' => $detail->get('answer_date'),
    ]);

    // セット品の場合、セット品の明細を登録する
    if ($item_kind === 2) {
      $this->createSetItems($m);
    }
  }

  /**
   * 明細を更新する
   *
   * @param int $id 受注明細ID
   * @param int $receive_order_id 受注ID
   * @param Collection $detail 明細データ
   */
  private function updateDetailItems(int $id, int $receive_order_id, $detail) {
    $item_kind = $detail->get('item_kind');

    $m = ReceiveOrderDetail::find($id);
    $prev = clone $m;

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
    $m->amount = $detail->get('amount');
    $m->sales_tax_rate = $detail->get('sales_tax_rate');
    $m->sales_tax = $detail->get('sales_tax');
    $m->answer_date = $detail->get('answer_date');
    $m->save();

    // セット品の場合、セット品の明細を登録する
    if ($item_kind === 2) {
      if ($prev->item_id != $m->item_id) {
        // 商品IDが変わった場合、セット品の明細を削除し登録する
        DB::table('receive_order_details')->where('parent_id', $id)->delete();
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
   * @param ReceiveOrderDetail $parent 親データ
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
        'amount' => $amount,
        'sales_tax_rate' => $parent->sales_tax_rate,
        'sales_tax' => $sales_tax,
        'parent_id' => $parent->id,
      ];
    }
    DB::table('receive_order_details')->insert($data);
  }

  /**
   * セット品の明細を更新する
   *
   * @param ReceiveOrderDetail $parent 親の明細データ
   */
  private function updateSetItems($parent) {
    $details = ReceiveOrderDetail::select([
      'receive_order_details.id',
      'set_item_details.quantity',
    ])
      ->join('set_item_details', 'set_item_details.id', '=', 'receive_order_details.item_id')
      ->where('parent_id', $parent->id)
      ->where('set_item_id', $parent->item_id)
      ->get();

    foreach ($details as $d) {
      $sales_unit_price = $d->set_price;
      $rate = $parent->rate;
      $unit_price = calc_unit_price($sales_unit_price, $rate, $parent->fraction);
      $quantity = $d->quantity * $parent->quantity;
      [$amount, $sales_tax] = calc_amount($unit_price, $quantity, $parent->sales_tax_rate, $parent->fraction);

      DB::table('receive_order_details')
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
   * @param int $receive_order_id 受注ID
   * @param mixed $details 明細データ
   */
  private function deleteDetails(int $receive_order_id, $details) {
    $prevIds = $this->getPrevDetailIds($receive_order_id);
    $currentIds = Arr::pluck($details, 'id');

    // 変更前のIDと更新されたIDの差分を取得する
    $deleteIds = array_diff($prevIds, $currentIds);

    DB::table('receive_order_details')
      ->whereIn('id', $deleteIds)
      ->delete();
  }

  /**
   * 変更前の明細のIDの配列を取得する
   *
   * @param int $receive_order_id 受注ID
   * @return array
   */
  private function getPrevDetailIds(int $receive_order_id) {
    $data =  DB::table('receive_order_details')
      ->where('receive_order_id', $receive_order_id)
      ->whereIn('item_kind', [1, 2])
      ->pluck('id')
      ->toArray();
    return $data;
  }

  /**
   * 見積受注連結テーブルを登録する
   *
   * @param int $estimate_id 見積ID
   * @param int $receive_order_id 受注ID
   */
  private function insertEstimateReceiveOrder(int $estimate_id, int $receive_order_id) {
    DB::table('link_estimate_receive_order')->insert([
      ['estimate_id' => $estimate_id, 'receive_order_id' => $receive_order_id]
    ]);
  }
}