<?php

namespace App\Api\Purchase\Services;

use App\Base\Models\Inventory;
use App\Base\Models\InventoryMove;
use App\Base\Models\Item;
use App\Base\Models\Purchase;
use App\Base\Models\PurchaseDetail;
use App\Base\Models\PlaceOrderDetail;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/**
 * 仕入データサービス
 */
class PurchaseService
{
  /**
   * 一覧データを取得する
   *
   * @param array $cond 検索条件
   * @return array
   */
  public function fetch(array $cond)
  {
    $query = Purchase::select(
      'purchases.id',
      'purchase_date',
      'total_amount',
      'users.name AS user_name',
    );
    $query = $this->setCondition($query, $cond);
    $query->orderBy('purchase_date', 'desc');
    return $query->paginate(config('const.paginate.per_page'))->toArray();
  }

  /**
   * 詳細データを取得する
   *
   * @param int $purchase_id 仕入ID
   * @return array
   */
  public function get(int $purchase_id)
  {
    $data = Purchase::select(
      'purchases.*',
      'users.name AS user_name',
      'link_p_order_purchase.place_order_id',
    )
      ->leftJoin('users', 'users.id', '=', 'purchases.user_id')
      ->leftJoin('link_p_order_purchase', 'link_p_order_purchase.purchase_id', '=', 'purchases.id')
      ->where('purchases.id', $purchase_id)
      ->first()
      ->toArray();

    $data['details'] = $this->getDetails($purchase_id);
    return $data;
  }

  /**
   * 新規作成時のデータを作成する
   *
   * @return array
   */
  public function newData()
  {
    $m = new Purchase();
    $m->purchase_date = Carbon::today()->format('Y/m/d');
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
    DB::transaction(function () use ($data) {
      $m = Purchase::create($data->toArray());
      $m->save();

      // 発注仕入連結テーブルを登録する
      $place_order_id = $data->get('place_order_id');
      if ($place_order_id) {
        $this->insertPlaceOrderPurchase($place_order_id, $m->id);
      }

      // 明細を登録する
      $details = $data->get('details');
      $this->insertDetails($m->id, $details, $place_order_id);

      // 入出庫データを登録する
      $this->insertInventoryMoves($m->id);

      // 国内在庫数を更新する
      $this->updateDomesticStock($m->id, []);
    });
  }

  /**
   * 更新
   *
   * @param int $id 仕入ID
   * @param array $data 更新データ
   */
  public function update(int $id, array $data)
  {
    $data = new Collection($data);
    DB::transaction(function () use ($id, $data) {
      $m = Purchase::find($id);

      $pre_item_numbers = $m->getItemNumbers();

      $m->purchase_date = $data->get('purchase_date');
      $m->user_id = $data->get('user_id');
      $m->total_amount = $data->get('total_amount');
      $m->remarks = $data->get('remarks');
      $m->save();

      // 明細を更新する
      $details = $data->get('details');
      $this->updateDetails($id, $details);

      // 入出庫データを登録する
      $this->insertInventoryMoves($m->id);

      // 国内在庫数を更新する
      $this->updateDomesticStock($m->id, $pre_item_numbers);
    });
  }

  /**
   * 削除
   *
   * @param int $id 仕入ID
   */
  public function delete(int $id)
  {
    DB::transaction(function () use ($id) {
      $m = Purchase::find($id);
      $pre_item_numbers = $m->getItemNumbers();

      Purchase::destroy($id);

      // 国内在庫数を更新する
      $this->updateDomesticStock($m->id, $pre_item_numbers);
    });
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
    $query->leftJoin('users', 'users.id', '=', 'purchases.user_id');

    $cond = new Collection($cond);

    $c_purchase_date_from = $cond->get('c_purchase_date_from');
    if ($c_purchase_date_from) {
      $query->where('purchase_date', '>=', $c_purchase_date_from);
    }

    $c_purchase_date_to = $cond->get('c_purchase_date_to');
    if ($c_purchase_date_to) {
      $query->where('purchase_date', '<=', $c_purchase_date_to);
    }

    $c_customer_name = $cond->get('c_user_name');
    if ($c_customer_name) {
      $query->where('users.name', 'like', '%' . escape_like($c_customer_name) . '%');
    }

    $c_item_number = $cond->get('c_item_number');
    if ($c_item_number) {
      $query->whereExists(function ($q) use ($c_item_number) {
        $q->select(DB::raw(1))
          ->from('purchase_details')
          ->whereRaw('purchase_details.purchase_id = purchases.id')
          ->where('purchase_details.item_number', 'like', '%' . escape_like($c_item_number) . '%');
        });
    }

    $c_name = $cond->get('c_name');
    if ($c_name) {
      $query->whereExists(function ($q) use ($c_name) {
        $q->select(DB::raw(1))
          ->from('purchase_details')
          ->whereRaw('purchase_details.purchase_id = purchases.id')
          ->where(function($q) use ($c_name) {
            $q->where('purchase_details.item_name', 'like', '%' . escape_like($c_name) . '%')
              ->orWhere('purchase_details.item_name_jp', 'like', '%' . escape_like($c_name) . '%');
          });
        });
    }

    return $query;
  }

  /**
   * 明細を取得する
   *
   * @param int $purchase_id 仕入ID
   * @return array
   */
  private function getDetails(int $purchase_id)
  {
    return DB::table('purchase_details')
      ->select(
        'purchase_details.*',
      )
      ->where('purchase_id', $purchase_id)
      ->whereIn('item_kind', [1, 2])
      ->orderBy('purchase_id')
      ->orderBy('no')
      ->get()
      ->toArray();
  }

  /**
   * 明細を登録する
   *
   * @param int $purchase_id 仕入ID
   * @param mixed $details 明細データ
   * @param int|null $place_order_id 発注ID
   */
  private function insertDetails(int $purchase_id, $details, $place_order_id)
  {
    if ($details) {
      foreach ($details as $detail) {
        $detail = new Collection($detail);

        $this->createDetailItems($purchase_id, $detail, $place_order_id);
      }
    }
  }

  /**
   * 明細を更新する
   *
   * @param int $purchase_id 仕入ID
   * @param mixed $details 明細データ
   */
  private function updateDetails(int $purchase_id, $details)
  {
    // 削除された明細をDBから削除する
    $this->deleteDetails($purchase_id, $details);

    if ($details) {
      foreach ($details as $detail) {
        $detail = new Collection($detail);
        $id = $detail->get('id');

        // 明細IDが存在する場合は更新、しない場合は登録する
        if ($id) {
          $this->updateDetailItems($id, $purchase_id, $detail);
        } else {
          $this->createDetailItems($purchase_id, $detail);
        }
      }
    }
  }

  /**
   * 明細を生成する
   *
   * @param int $purchase_id 仕入ID
   * @param Collection $detail 明細データ
   * @param int|null $place_order_id 発注ID
   */
  private function createDetailItems(
    int $purchase_id,
    $detail,
    $place_order_id = null
  ) {
    $item_kind = $detail->get('item_kind');
    $item_id = $detail->get('item_id');

    $m = PurchaseDetail::create([
      'id' => null,
      'purchase_id' => $purchase_id,
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

    // 発注仕入明細連結テーブルを登録する
    if ($place_order_id) {
      $this->insertPlaceOrderDetailPurchaseDetail($detail->get('place_order_detail_id'), $m->id);
    }

    // セット品の場合、セット品の明細を登録する
    if ($item_kind === 2) {
      if ($place_order_id) {
        // セット品の明細を発注データから生成する
        $this->createSetItemsByPlaceOrder($purchase_id, $detail->get('place_order_detail_id'), $m);
      } else {
        $this->createSetItems($purchase_id, $item_id, $m);
      }
    }
  }

  /**
   * 明細を更新する
   *
   * @param int $id 仕入明細ID
   * @param int $purchase_id 仕入ID
   * @param Collection $detail 明細データ
   */
  private function updateDetailItems(int $id, int $purchase_id, $detail) {
    $item_kind = $detail->get('item_kind');
    $item_id = $detail->get('item_id');

    $m = PurchaseDetail::find($id);
    $prev_item_id = $m->item_id;

    $m->id = $id;
    $m->purchase_id = $purchase_id;
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
    if ($prev_item_id != $item_id) {
      DB::table('purchase_details')->where('parent_id', $id)->delete();

      // セット品の場合、セット品の明細を登録する
      if ($item_kind === 2) {
        $this->createSetItems($purchase_id, $item_id, $m);
      }
    }
  }

  /**
   * セット品の明細を生成する
   *
   * @param int $purchase_id 仕入ID
   * @param int $item_id 商品ID
   * @param PurchaseDetail $parent 親データ
   */
  private function createSetItems(int $purchase_id, int $item_id, $parent) {
    $items = Item::getSetItems($item_id);
    $data = [];
    foreach ($items as $i => $item) {
      $data[] = [
        'id' => null,
        'purchase_id' => $purchase_id,
        'no' => 0,
        'item_kind' => 3,
        'item_id' => $item_id,
        'item_number' => $item->item_number,
        'item_name' => $item->name,
        'item_name_jp' => $item->name_jp,
        'unit_price' => $item->set_price,
        'quantity' => $item->quantity,
        'amount' => 0,
        'sales_tax_rate' => $parent->sales_tax_rate,
        'sales_tax' => 0,
        'parent_id' => $parent->id,
      ];
    }
    DB::table('purchase_details')->insert($data);
  }

  /**
   * セット品の明細を発注データから生成する
   *
   * @param int $purchase_id 仕入ID
   * @param int $place_order_detail_id 発注明細ID
   * @param EstimateDetail $parent 親データ
   */
  private function createSetItemsByPlaceOrder(
    int $purchase_id,
    int $place_order_detail_id,
    $parent
  ) {
    $rows = PlaceOrderDetail::where('parent_id', $place_order_detail_id)->get();

    $data = [];
    foreach ($rows as $row) {

      $m = PurchaseDetail::create([
        'id' => null,
        'purchase_id' => $purchase_id,
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

      $this->insertPlaceOrderDetailPurchaseDetail($row->id, $m->id);
    }
  }

  /**
   * 削除された明細をDBから削除する
   *
   * @param int $purchase_id 仕入ID
   * @param mixed $details 明細データ
   */
  private function deleteDetails(int $purchase_id, $details) {
    $prevIds = $this->getPrevDetailIds($purchase_id);
    $currentIds = Arr::pluck($details, 'id');

    // 変更前のIDと更新されたIDの差分を取得する
    $deleteIds = array_diff($prevIds, $currentIds);

    DB::table('purchase_details')
      ->whereIn('id', $deleteIds)
      ->delete();
  }

  /**
   * 変更前の明細のIDの配列を取得する
   *
   * @param int $purchase_id 仕入ID
   * @return array
   */
  private function getPrevDetailIds(int $purchase_id) {
    $data =  DB::table('purchase_details')
      ->where('purchase_id', $purchase_id)
      ->whereIn('item_kind', [1, 2])
      ->pluck('id')
      ->toArray();
    return $data;
  }

  /**
   * 発注仕入連結テーブルを登録する
   *
   * @param int $place_order_id 発注ID
   * @param int $purchase_id 仕入ID
   */
  private function insertPlaceOrderPurchase(int $place_order_id, int $purchase_id) {
    DB::table('link_p_order_purchase')->insert([
      ['place_order_id' => $place_order_id, 'purchase_id' => $purchase_id]
    ]);
  }

  /**
   * 発注仕入明細連結テーブルを登録する
   *
   * @param int $place_order_detail_id 発注明細ID
   * @param int $purchase_detail_id 仕入明細ID
   */
  private function insertPlaceOrderDetailPurchaseDetail(int $place_order_detail_id, int $purchase_detail_id) {
    if ($place_order_detail_id) {
      DB::table('link_p_order_purchase_detail')->insert([
        ['place_order_detail_id' => $place_order_detail_id, 'purchase_detail_id' => $purchase_detail_id]
      ]);
    }
  }

  /**
   * 入出庫データを登録する
   *
   * @param int $purchase_id
   */
  private function insertInventoryMoves(int $purchase_id)
  {
    DB::table('inventory_moves')->where('purchase_id', '=', $purchase_id)->delete();
    DB::insert("INSERT INTO inventory_moves (job_date
      , detail_kind
      , purchase_id
      , item_number
      , quantity
      , created_at)
    SELECT p.purchase_date
      , 1
      , p.id
      , d.item_number
      , d.quantity
      , CURRENT_TIMESTAMP
    FROM purchases p INNER JOIN purchase_details d ON d.purchase_id = p.id
    WHERE p.id = :id AND d.item_kind <> 2 ", ['id' => $purchase_id]);
  }

  /**
   * 国内在庫数を更新する
   *
   * @param int $purchase_id
   * @param array $pre_item_numbers
   */
  private function updateDomesticStock(int $purchase_id, array $pre_item_numbers)
  {
    $m = Purchase::find($purchase_id);
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