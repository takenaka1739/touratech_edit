<?php

namespace App\Api\PlaceOrder\Services;

use App\Api\PlaceOrder\Mail\PlaceOrderMail;
use App\Base\Models\Config;
use App\Base\Models\Customer;
use App\Base\Models\Item;
use App\Base\Models\PlaceOrder;
use App\Base\Models\PlaceOrderDetail;
use App\Base\Models\ReceiveOrder;
use App\Base\Models\ReceiveOrderDetail;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

/**
 * 発注データサービス
 */
class PlaceOrderService
{
  /**
   * 検索画面用の一覧データを取得する
   *
   * @param array $cond 検索条件
   * @return array
   */
  public function dialog(array $cond)
  {
    $query = PlaceOrder::select(
      'place_orders.id',
      'place_order_date',
      'total_amount',
      'users.name AS user_name',
    );
    $query = $this->setCondition($query, $cond);
    $query->orderBy('place_order_date', 'desc');
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
    $query = PlaceOrder::select(
      'place_orders.id',
      'place_order_date',
      'total_amount',
      'users.name AS user_name',
    );
    $query = $this->setCondition($query, $cond);
    $query->orderBy('place_order_date', 'desc');
    return $query->paginate(config('const.paginate.per_page'))->toArray();
  }

  /**
   * 詳細データを取得する
   *
   * @param int $place_order_id 発注ID
   * @param bool $is_purchase 仕入の場合true
   * @return array
   */
  public function get(int $place_order_id, bool $is_purchase = false)
  {
    $data = PlaceOrder::select(
      'place_orders.*',
      'users.name AS user_name',
      'link_r_order_p_order.receive_order_id',
    )
      ->leftJoin('users', 'users.id', '=', 'place_orders.user_id')
      ->leftJoin('link_r_order_p_order', 'link_r_order_p_order.place_order_id', '=', 'place_orders.id')
      ->where('place_orders.id', $place_order_id)
      ->first()
      ->toArray();

      $details = $this->getDetails($place_order_id);

      // 仕入の場合
      if ($is_purchase) {
        $groups = $this->getPurchaseQuantityGroups($place_order_id);
        foreach ($details as $d)
        {
          $id = $d->id;
          if ($groups->has($id)) {
            $d->purchase_quantity = $groups->get($id)->sum('u_quantity');
          } else {
            $d->purchase_quantity = 0;
          }
        }
      }
      $data['details'] = $details;
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
    )
      ->leftJoin('users', 'users.id', '=', 'receive_orders.user_id')
      ->where('receive_orders.id', $receive_order_id)
      ->first();

    $user = Auth::user();

    $details = $this->getDetailsByReceiveId($receive_order_id);
    $groups = ReceiveOrder::getPlaceQuantityGroups($receive_order_id);
    foreach ($details as $d)
    {
      $id = $d->receive_order_detail_id;
      if ($groups->has($id)) {
        $d->place_quantity = $groups->get($id)->sum('p_quantity');
      } else {
        $d->place_quantity = 0;
      }
      $d->unit_price = $d->unit_price ?? 0;
      $d->quantity = $d->quantity - $d->place_quantity;
      [$amount, $sales_tax] = calc_amount($d->unit_price, $d->quantity, $d->sales_tax_rate, $d->fraction);
      $d->amount = $amount;
      $d->sales_tax = $sales_tax;
    }

    $total_amount = $details->sum('amount');

    return [
      'place_order_date' => Carbon::today()->format('Y/m/d'),
      'user_id' => $user->id,
      'user_name' => $user->name,
      'total_amount' => $total_amount,
      'remarks' => $query->remarks,
      'fraction' => $query->fraction,
      'receive_order_id' => $query->id,
      'details' => $details->toArray()
    ];
  }

  /**
   * 新規作成時のデータを作成する
   *
   * @return array
   */
  public function newData()
  {
    $m = new PlaceOrder();
    $m->place_order_date = Carbon::today()->format('Y/m/d');
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
   * @param array $data 登録データ
   */
  public function store(array $data)
  {
    $data = new Collection($data);
    return DB::transaction(function () use ($data) {
      $m = PlaceOrder::create($data->toArray());
      $m->save();

      // 受注発注連結テーブルを登録する
      $receive_order_id = $data->get('receive_order_id');
      if ($receive_order_id) {
        $this->insertReceiveOrderPlaceOrder($receive_order_id, $m->id);
      }

      // 明細を登録する
      $details = $data->get('details');
      $this->insertDetails($m->id, $details, $receive_order_id);

      if ($receive_order_id) {
        // place_completedの更新
        $this->updatePlaceCompleted($receive_order_id);

        // has_p_orderの更新
        $this->updateHasPOrder($receive_order_id);
      }

      return $m->id;
    });
  }

  /**
   * @param array $data
   * @param int|null $id
   */
  public function hasOrderMail(array $data, $id = null)
  {
    $data = new Collection($data);
    if ($id) {
      $p = $this->get($id);
      $receive_order_id = $p["receive_order_id"];
    } else {
      $receive_order_id = $data->get('receive_order_id');
    }

    if ($receive_order_id) {
      $rm = ReceiveOrder::find($receive_order_id);
      if ($rm && $rm->customer_id) {
        $cm = Customer::find($rm->customer_id);
        if ($cm && $cm->email) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 更新
   *
   * @param int $place_order_id 発注ID
   * @param array $data 更新データ
   */
  public function update(int $place_order_id, array $data)
  {
    $data = new Collection($data);

    DB::transaction(function () use ($place_order_id, $data) {
      $m = PlaceOrder::find($place_order_id);
      $m->place_order_date = $data->get('place_order_date');
      $m->user_id = $data->get('user_id');
      $m->delivery_day = $data->get('delivery_day');
      $m->total_amount = $data->get('total_amount');
      $m->remarks = $data->get('remarks');
      $m->fraction = $data->get('fraction');
      $m->save();

      // 明細を更新する
      $details = $data->get('details');
      $this->updateDetails($place_order_id, $details);

      $receive_order_id = $m->getReceiveOrderId();

      if ($receive_order_id) {
        // place_completedの更新
        $this->updatePlaceCompleted($receive_order_id);

        // has_p_orderの更新
        $this->updateHasPOrder($receive_order_id);
      }
    });
  }

  /**
   * 削除
   *
   * @param int $place_order_id 発注ID
   */
  public function delete(int $place_order_id)
  {
    DB::transaction(function () use ($place_order_id) {
      $m = PlaceOrder::find($place_order_id);
      $receive_order_id = $m->getReceiveOrderId();

      // 外部キーを設定しない代わりに手動で削除する
      DB::table('link_r_order_p_order_detail ld')
        ->join('place_order_details d', 'd.id', '=', 'ld.place_order_detail_id')
        ->where('d.place_order_id', '=', $place_order_id);
      DB::table('link_r_order_p_order')
      ->where('place_order_id', '=', $place_order_id)
      ->delete();

      PlaceOrder::destroy($place_order_id);


      if ($receive_order_id) {
        // place_completedの更新
        $this->updatePlaceCompleted($receive_order_id);

        // has_p_orderの更新
        $this->updateHasPOrder($receive_order_id);
      }
    });
  }

  /**
   * メール取得
   *
   * @param array $data
   * @return string
   */
  public function getMail(array $data)
  {
    $data = new Collection($data);
    $place_order_id = $data->get('id');
    $m = PlaceOrder::select(
      'place_orders.delivery_day',
      'receive_orders.id AS receive_order_id',
      'receive_orders.receive_order_date',
      'receive_orders.customer_name',
      'customers.email',
    )
      ->leftJoin('link_r_order_p_order', 'link_r_order_p_order.place_order_id', '=', 'place_orders.id')
      ->leftJoin('receive_orders', 'receive_orders.id', '=', 'link_r_order_p_order.receive_order_id')
      ->leftJoin('customers', 'customers.id', '=', 'receive_orders.customer_id')
      ->where('place_orders.id', $place_order_id)
      ->first();

    $config = Config::getSelf();

    return (new PlaceOrderMail(
        $m->customer_name,
        $m->receive_order_id,
        Carbon::parse($m->receive_order_date)->format('Y/m/d'),
        $m->delivery_day,
        $config->company_name
      ))->render();
  }

  /**
   * メール送信
   *
   * @param array $data
   * @return boolean
   */
  public function sendingMail(array $data)
  {
    $data = new Collection($data);
    $place_order_id = $data->get('id');
    $m = PlaceOrder::select(
      'place_orders.delivery_day',
      'receive_orders.id AS receive_order_id',
      'receive_orders.receive_order_date',
      'receive_orders.customer_name',
      'customers.email',
    )
      ->leftJoin('link_r_order_p_order', 'link_r_order_p_order.place_order_id', '=', 'place_orders.id')
      ->leftJoin('receive_orders', 'receive_orders.id', '=', 'link_r_order_p_order.receive_order_id')
      ->leftJoin('customers', 'customers.id', '=', 'receive_orders.customer_id')
      ->where('place_orders.id', $place_order_id)
      ->first();

    $config = Config::getSelf();
    $bcc = config('const.mail.place_order.bcc');

    Mail::to($m->email)
      ->bcc($bcc)
      ->send(new PlaceOrderMail(
        $m->customer_name,
        $m->receive_order_id,
        Carbon::parse($m->receive_order_date)->format('Y/m/d'),
        $m->delivery_day,
        $config->company_name
      ));
    if (count(Mail::failures()) > 0) {
      return false;
    }

    return true;
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
    $query->leftJoin('users', 'users.id', '=', 'place_orders.user_id');

    $cond = new Collection($cond);

    $c_place_order_date_from = $cond->get('c_place_order_date_from');
    if ($c_place_order_date_from) {
      $query->where('place_order_date', '>=', $c_place_order_date_from);
    }

    $c_place_order_date_to = $cond->get('c_place_order_date_to');
    if ($c_place_order_date_to) {
      $query->where('place_order_date', '<=', $c_place_order_date_to);
    }

    $c_customer_name = $cond->get('c_user_name');
    if ($c_customer_name) {
      $query->where('users.name', 'like', '%' . escape_like($c_customer_name) . '%');
    }

    $c_item_number = $cond->get('c_item_number');
    if ($c_item_number) {
      $query->whereExists(function ($q) use ($c_item_number) {
        $q->select(DB::raw(1))
          ->from('place_order_details')
          ->whereRaw('place_order_details.place_order_id = place_orders.id')
          ->where('place_order_details.item_number', 'like', '%' . escape_like($c_item_number) . '%');
        });
    }

    $c_name = $cond->get('c_name');
    if ($c_name) {
      $query->whereExists(function ($q) use ($c_name) {
        $q->select(DB::raw(1))
          ->from('place_order_details')
          ->whereRaw('place_order_details.place_order_id = place_orders.id')
          ->where(function($q) use ($c_name) {
            $q->where('place_order_details.item_name', 'like', '%' . escape_like($c_name) . '%')
              ->orWhere('place_order_details.item_name_jp', 'like', '%' . escape_like($c_name) . '%');
          });
        });
    }

    $c_is_purchased = $cond->get('c_is_purchased');
    if ($c_is_purchased === "1") {
      $query->whereNotExists(function ($q) {
        $q->select(DB::raw(1))
          ->from('place_order_details')
          ->whereRaw('place_order_details.place_order_id = place_orders.id')
          ->where('place_order_details.purchased', '=', 0);
      });
    } else if ($c_is_purchased === "0") {
      $query->whereExists(function ($q) {
        $q->select(DB::raw(1))
          ->from('place_order_details')
          ->whereRaw('place_order_details.place_order_id = place_orders.id')
          ->where('place_order_details.purchased', '=', 0);
      });
    }

    return $query;
  }

  /**
   * 明細を取得する
   *
   * @param int $place_order_id 発注ID
   * @return array
   */
  private function getDetails(int $place_order_id)
  {
    return DB::table('place_order_details')
      ->select(
        'place_order_details.*',
      )
      ->where('place_order_id', $place_order_id)
      ->whereIn('item_kind', [1, 2])
      ->orderBy('place_order_id')
      ->orderBy('no')
      ->get()
      ->toArray();
  }

  /**
   * @param int $place_order_id
   * @return Collection
   */
  private function getPurchaseQuantityGroups(int $place_order_id)
  {
    $rows = DB::table('place_orders as po')
      ->select([
        'pd.id as place_detail_id',
        'pd.quantity as p_quantity',
        'ud.quantity as u_quantity',
      ])
      ->join('place_order_details as pd', 'pd.place_order_id', '=', 'po.id')
      ->join('link_p_order_purchase_detail as l', 'l.place_order_detail_id', '=', 'pd.id')
      ->join('purchase_details as ud', 'ud.id', '=', 'l.purchase_detail_id')
      ->where('po.id', '=', $place_order_id)
      ->whereIn('ud.item_kind', [1, 2])
      ->get();

    return $rows->groupBy('place_detail_id');
  }

  /**
   * 受注データの明細を取得する
   *
   * @param int $receive_order_id 受注ID
   * @return Collection
   */
  private function getDetailsByReceiveId(int $receive_order_id)
  {
    return DB::table('receive_order_details AS rd')
      ->select(
        'rd.id AS receive_order_detail_id',
        'rd.no',
        'rd.item_kind',
        'rd.item_id',
        'rd.item_number',
        'rd.item_name',
        'rd.item_name_jp',
        'rd.rate',
        'rd.fraction',
        'rd.quantity',
        'rd.amount',
        'rd.sales_tax_rate',
        'rd.sales_tax',
        'items.purchase_unit_price AS unit_price',
      )
      ->join('items', 'items.id', '=', 'rd.item_id')
      ->where('rd.receive_order_id', $receive_order_id)
      ->whereIn('rd.item_kind', [1, 2])
      ->where('rd.place_completed', '<>', 1)
      ->orderBy('rd.receive_order_id')
      ->orderBy('rd.no')
      ->get();
  }

  /**
   * 明細を登録する
   *
   * @param int $place_order_id 発注ID
   * @param mixed $details 明細データ
   * @param int|null $receive_order_id 受注ID
   */
  private function insertDetails(int $place_order_id, $details, $receive_order_id)
  {
    if ($details) {
      foreach ($details as $detail) {
        $detail = new Collection($detail);

        $this->createDetailItems($place_order_id, $detail, $receive_order_id);
      }
    }
  }

  /**
   * 明細を更新する
   *
   * @param int $place_order_id 発注ID
   * @param mixed $details 明細データ
   */
  private function updateDetails(int $place_order_id, $details)
  {
    // 削除された明細をDBから削除する
    $this->deleteDetails($place_order_id, $details);

    if ($details) {
      foreach ($details as $detail) {
        $detail = new Collection($detail);
        $id = $detail->get('id');

        // 明細IDが存在する場合は更新、しない場合は登録する
        if ($id) {
          $this->updateDetailItems($id, $place_order_id, $detail);
        } else {
          $this->createDetailItems($place_order_id, $detail);
        }
      }
    }
  }


  /**
   * 明細を生成する
   *
   * @param int $place_order_id 発注ID
   * @param Collection $detail 明細データ
   * @param int|null $receive_order_id 受注ID
   */
  private function createDetailItems(
    int $place_order_id,
    $detail,
    $receive_order_id = null
  ) {
    $item_kind = $detail->get('item_kind');
    $item_id = $detail->get('item_id');

    $m = PlaceOrderDetail::create([
      'id' => null,
      'place_order_id' => $place_order_id,
      'no' => $detail->get('no'),
      'item_kind' => $item_kind,
      'item_id' => $item_id,
      'item_number' => $detail->get('item_number'),
      'item_name' => $detail->get('item_name'),
      'item_name_jp' => $detail->get('item_name_jp'),
      'unit_price' => $detail->get('unit_price'),
      'quantity' => $detail->get('quantity'),
      'amount' => $detail->get('amount'),
      'sales_tax_rate' => $detail->get('sales_tax_rate'),
      'sales_tax' => $detail->get('sales_tax'),
    ]);

    // 受注発注明細連結テーブルを登録する
    if ($receive_order_id) {
      $this->insertReceiveOrderDetailPlaceOrderDetail($detail->get('receive_order_detail_id'), $m->id);
    }

    // セット品の場合、セット品の明細を登録する
    if ($item_kind === 2) {
      if ($receive_order_id) {
        // セット品の明細を受注データから生成する
        $this->createSetItemsByReceiveOrder($place_order_id, $detail->get('receive_order_detail_id'), $m);
      } else {
        $this->createSetItems($place_order_id, $item_id, $m);
      }
    }
  }

  /**
   * 明細を更新する
   *
   * @param int $id 発注明細ID
   * @param int $place_order_id 発注ID
   * @param Collection $detail 明細データ
   */
  private function updateDetailItems(int $id, int $place_order_id, $detail) {
    $item_kind = $detail->get('item_kind');
    $item_id = $detail->get('item_id');
    $quantity = $detail->get('quantity');

    $m = PlaceOrderDetail::find($id);
    $prev_item_id = $m->item_id;
    $prev_quantity = $m->quantity;

    $m->id = $id;
    $m->place_order_id = $place_order_id;
    $m->no = $detail->get('no');
    $m->item_kind = $item_kind;
    $m->item_id = $item_id;
    $m->item_number = $detail->get('item_number');
    $m->item_name = $detail->get('item_name');
    $m->item_name_jp = $detail->get('item_name_jp');
    $m->unit_price = $detail->get('unit_price');
    $m->quantity = $detail->get('quantity');
    $m->amount = $detail->get('amount');
    $m->sales_tax_rate = $detail->get('sales_tax_rate');
    $m->sales_tax = $detail->get('sales_tax');
    $m->save();

    // 商品IDが変わった場合、セット品の明細を削除する
    if ($prev_item_id != $item_id || $prev_quantity != $quantity) {
      DB::table('place_order_details')->where('parent_id', $id)->delete();

      // セット品の場合、セット品の明細を登録する
      if ($item_kind === 2) {
        $this->createSetItems($place_order_id, $item_id, $m);
      }
    }
  }

  /**
   * セット品の明細を生成する
   *
   * @param int $place_order_id 発注ID
   * @param int $item_id 商品ID
   * @param PlaceOrderDetail $parent 親データ
   */
  private function createSetItems(int $place_order_id, int $item_id, $parent) {
    $items = Item::getSetItems($item_id);
    $data = [];
    foreach ($items as $i => $item) {
      $data[] = [
        'id' => null,
        'place_order_id' => $place_order_id,
        'no' => 0,
        'item_kind' => 3,
        'item_id' => $item_id,
        'item_number' => $item->item_number,
        'item_name' => $item->name,
        'item_name_jp' => $item->name_jp,
        'unit_price' => $item->set_price,
        'quantity' => $item->quantity * $parent->quantity,
        'amount' => 0,
        'sales_tax_rate' => $parent->sales_tax_rate,
        'sales_tax' => 0,
        'parent_id' => $parent->id,
      ];
    }
    DB::table('place_order_details')->insert($data);
  }

  /**
   * セット品の明細を受注データから生成する
   *
   * @param int $place_order_id 発注ID
   * @param int $receive_order_detail_id 受注明細ID
   * @param PlaceOrderDetail $parent 親データ
   */
  private function createSetItemsByReceiveOrder(int $place_order_id, int $receive_order_detail_id, $parent) {
    $rows = ReceiveOrderDetail::where('parent_id', $receive_order_detail_id)->get();

    foreach ($rows as $row) {
      $m = PlaceOrderDetail::create([
        'id' => null,
        'place_order_id' => $place_order_id,
        'no' => $row->no,
        'item_kind' => $row->item_kind,
        'item_id' => $row->item_id,
        'item_number' => $row->item_number,
        'item_name' => $row->name,
        'item_name_jp' => $row->name_jp,
        'unit_price' => $row->unit_price,
        'quantity' => $row->quantity,
        'amount' => $row->amount,
        'sales_tax_rate' => $parent->sales_tax_rate,
        'sales_tax' => $row->sales_tax,
        'parent_id' => $parent->id,
      ]);

      $this->insertReceiveOrderDetailPlaceOrderDetail($row->id, $m->id);
    }
  }

  /**
   * 削除された明細をDBから削除する
   *
   * @param int $id 発注ID
   * @param mixed $details 明細データ
   */
  private function deleteDetails(int $place_order_id, $details) {
    $prevIds = $this->getPrevDetailIds($place_order_id);
    $currentIds = Arr::pluck($details, 'id');

    // 変更前のIDと更新されたIDの差分を取得する
    $deleteIds = array_diff($prevIds, $currentIds);

    DB::table('place_order_details')
      ->whereIn('id', $deleteIds)
      ->delete();
  }

  /**
   * 変更前の明細のIDの配列を取得する
   *
   * @param int $place_order_id 発注ID
   * @return array
   */
  private function getPrevDetailIds(int $place_order_id) {
    $data =  DB::table('place_order_details')
      ->where('place_order_id', $place_order_id)
      ->whereIn('item_kind', [1, 2])
      ->pluck('id')
      ->toArray();
    return $data;
  }

  /**
   * 受注発注連結テーブルを登録する
   *
   * @param int $receive_order_id 受注ID
   * @param int $place_order_id 発注ID
   */
  private function insertReceiveOrderPlaceOrder(int $receive_order_id, int $place_order_id) {
    DB::table('link_r_order_p_order')->insert([
      ['receive_order_id' => $receive_order_id, 'place_order_id' => $place_order_id]
    ]);
  }

  /**
   * 受注発注明細連結テーブルを登録する
   *
   * @param int $receive_order_detail_id 受注明細ID
   * @param int $place_order_detail_id 発注明細ID
   */
  private function insertReceiveOrderDetailPlaceOrderDetail(int $receive_order_detail_id, int $place_order_detail_id) {
    if ($receive_order_detail_id) {
      DB::table('link_r_order_p_order_detail')->insert([
        ['receive_order_detail_id' => $receive_order_detail_id, 'place_order_detail_id' => $place_order_detail_id]
      ]);
    }
  }

  /**
   * place_completedの更新
   *
   * @param int $receive_order_id 受注ID
   */
  private function updatePlaceCompleted(int $receive_order_id)
  {
    DB::update("UPDATE receive_order_details AS rd LEFT JOIN (SELECT x.receive_order_detail_id, sum(y.quantity) AS quantity FROM link_r_order_p_order_detail x INNER JOIN place_order_details y ON y.id = x.place_order_detail_id GROUP BY x.receive_order_detail_id) AS pd ON pd.receive_order_detail_id = rd.id
      SET place_completed = CASE WHEN rd.quantity <= pd.quantity THEN 1 ELSE 0 END
      WHERE rd.receive_order_id = ?", [$receive_order_id]);
  }

    /**
   * has_p_orderの更新
   *
   * @param int $receive_order_id 受注ID
   */
  private function updateHasPOrder(int $receive_order_id)
  {
    $has_p_order = 0;

    $rows = DB::table('receive_orders as r')
      ->select([
        'rd.id as receive_detail_id',
        'rd.quantity as r_quantity',
        'pd.quantity as p_quantity',
      ])
      ->join('receive_order_details as rd', 'rd.receive_order_id', '=', 'r.id')
      ->leftJoin('link_r_order_p_order_detail as l', 'l.receive_order_detail_id', '=', 'rd.id')
      ->leftJoin('place_order_details as pd', 'pd.id', '=', 'l.place_order_detail_id')
      ->where('r.id', '=', $receive_order_id)
      ->whereIn('rd.item_kind', [1, 2])
      ->get();

    if ($rows->sum('p_quantity') > 0) {
      $groups = $rows->groupBy('receive_detail_id');
      foreach ($groups as $g) {
        $has_p_order = 1;
        $r_quantity = $g->first()->r_quantity;
        $p_quantity = $g->sum('p_quantity');
        if ($r_quantity > $p_quantity) {
          $has_p_order = 2;
          break;
        }
      }
    }

    DB::table('receive_order_has_p_order')->updateOrInsert([
      'receive_order_id' => $receive_order_id,
    ], [
      'has_p_order' => $has_p_order
    ]);
  }
}