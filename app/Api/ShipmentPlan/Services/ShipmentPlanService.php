<?php

namespace App\Api\ShipmentPlan\Services;

use App\Base\Models\ShipmentPlan;
use Exception;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * 発送予定一覧サービス
 */
class ShipmentPlanService
{
  /**
   * 一覧データを取得する
   *
   * @param array $cond 検索条件
   * @return array
   */
  public function fetch(array $cond)
  {
    $query = ShipmentPlan::select();
    $query = $this->setCondition($query, $cond);
    $query->orderBy('shipment_plan_date', 'asc');
    return $query->paginate(1000)->toArray();
  }

  /**
   * 品番をチェックする
   * 
   * @param array $cond
   * @return Collection
   */
  public function checkItemNumber(array $cond)
  {
    $input = new Collection($cond);
    $selected = $input->get('selected');
    $c_shipment_plan_date_from = $input->get('c_shipment_plan_date_from');
    $c_shipment_plan_date_to = $input->get('c_shipment_plan_date_to');

    $rows = ShipmentPlan::select([
      'shipment_plans.item_number',
    ])
      ->where('shipment_plans.shipment_plan_date', '>=', $c_shipment_plan_date_from)
      ->where('shipment_plans.shipment_plan_date', '<=', $c_shipment_plan_date_to)
      ->whereIn('shipment_plans.id', $selected)
      ->whereNotExists(function($q) {
        $q->select(DB::raw(1))
          ->from('items')
          ->whereRaw('items.item_number = shipment_plans.item_number');
      })
      ->get();

    return $rows;
  }

  /**
   * 一括仕入
   * 
   * @param array $cond
   */
  public function bulkPurchase(array $cond)
  {
    DB::transaction(function () use ($cond) {

      // 一括仕入用のデータを取得する
      $rows = $this->getShipmentPlanData($cond);

      // 仕入データを作成する
      $data = $this->getPurchaseData(Auth::user()->id, $rows);

      DB::table('purchases')->insert($data['data']);
      DB::table('purchase_details')->insert($data['details']);

      $this->insertPlaceOrderPurchase($data['link_p_order_purchase']);
      $this->insertPlaceOrderDetailPurchaseDetail($data['link_p_order_purchase_detail']);

      // place_order_detailsのpurchasedを更新する
      $this->updatePlaceOrderDetailsPurchased();

      // 入出庫データを登録する
      $this->insertMoves($data['moves']);

      // 最新の棚卸データを取得する
      $latest = $this->getLatestInventories();

      // 入出庫データを取得する
      $moves = $this->getInventoryMoves($data['moves']);

      // 最新の棚卸データと増減をマージする
      $items = $this->mergeLatestMoves($latest, $moves);
      foreach ($items as $item) {
        DB::table('items')
          ->where('item_number', $item['item_number'])
          ->update(['domestic_stock' => $item['stocks']]);
      }

    });
  }

  /**
   * ラベル発行用データを作成する
   *
   * @param array $cond 条件
   * @return array
   */
  public function getPdfData(array $cond)
  {
    $input = new Collection($cond);
    $selected = $input->get('selected');
    $c_shipment_plan_date_from = $input->get('c_shipment_plan_date_from');
    $c_shipment_plan_date_to = $input->get('c_shipment_plan_date_to');

    $query = ShipmentPlan::select([
      'shipment_plans.shipment_plan_date',
      'shipment_plans.item_number',
      'shipment_plans.quantity',
      'items.name_label',
      'items.sales_unit_price',
    ])
      ->leftJoin('items', 'items.item_number', '=', 'shipment_plans.item_number')
      ->where('shipment_plans.shipment_plan_date', '>=', $c_shipment_plan_date_from)
      ->where('shipment_plans.shipment_plan_date', '<=', $c_shipment_plan_date_to);

    $c_item_number = $input->get('c_item_number');
    if ($c_item_number) {
      $query->where('shipment_plans.item_number', 'like', '%' . escape_like($c_item_number) . '%');
    }

    $query->whereIn('shipment_plans.id', $selected);
    $query->orderBy('shipment_plans.item_number');
    $rows = $query->get();

    $data = [];
    foreach ($rows as $row) {
      $quantity = $row->quantity;

      $d = $row->toArray();
      for ($i = 0; $i < $quantity; $i++) {
        $data[] = $d;
      }
    }
    return [
      'data' => $data
    ];
  }

  /**
   * 一括仕入用のデータを取得する
   * 
   * @param array $cond
   * @return array
   */
  private function getShipmentPlanData(array $cond)
  {
    $input = new Collection($cond);
    $selected = $input->get('selected');
    $c_shipment_plan_date_from = $input->get('c_shipment_plan_date_from');
    $c_shipment_plan_date_to = $input->get('c_shipment_plan_date_to');

    $placeOrders = DB::table('place_orders')
      ->join('place_order_details', 'place_order_details.place_order_id', '=', 'place_orders.id')
      ->select([
        'place_orders.id AS place_order_id',
        'place_orders.order_file_name',
        'place_order_details.id AS place_order_detail_id',
        'place_order_details.item_number',
      ]);

    $query = ShipmentPlan::select([
      'shipment_plans.id',
      'shipment_plans.shipment_plan_date',
      'shipment_plans.item_number',
      'shipment_plans.unit_price',
      'shipment_plans.quantity',
      'shipment_plans.amount',
      'items.id AS item_id',
      'po.place_order_id',
      'po.place_order_detail_id',
    ])
      ->leftJoin('items', 'items.item_number', '=', 'shipment_plans.item_number')
      ->leftJoinSub($placeOrders, 'po', function($join) {
        $join->on('shipment_plans.place_order_no', '=', 'po.order_file_name')
          ->on('shipment_plans.item_number', '=', 'po.item_number');
      })
      ->where('shipment_plans.shipment_plan_date', '>=', $c_shipment_plan_date_from)
      ->where('shipment_plans.shipment_plan_date', '<=', $c_shipment_plan_date_to)
      ->whereIn('shipment_plans.id', $selected);
    return $query->get()->toArray();
  }

  /**
   * 仕入データを作成する
   * 
   * @param int $user_id
   * @param array $rows
   * @return array
   */
  private function getPurchaseData(int $user_id, array $rows)
  {
    $id = DB::table('purchases')->max('id');
    $detail_id = DB::table('purchase_details')->max('id');

    $items = $this->getItems();

    $data = [];
    $details = [];
    $link_p_order_purchase = [];
    $link_p_order_purchase_detail = [];
    $moves = [];
    foreach ($rows as $row) {
      $row = new Collection($row);

      $id++;

      // purchases
      $data[] = [
        'id' => $id,
        'purchase_date' => $row->get('shipment_plan_date'),
        'user_id' => $user_id,
        'total_amount' => $row->get('amount'),
      ];

      $item_id = $row->get('item_id');
      $item_number = '';
      $item_name = '';
      $item_name_jp = '';
      if (array_key_exists($item_id, $items)) {
        $item_number = $items[$item_id][0]->item_number;
        $item_name = $items[$item_id][0]->name;
        $item_name_jp = $items[$item_id][0]->name_jp;
      } else {
        throw new Exception('商品データが存在しません。');
      }

      $detail_id++;

      // purchase_details
      $details[] = [
        'id' => $detail_id,
        'purchase_id' => $id,
        'no' => 1,
        'item_kind' => 1,
        'item_id' => $item_id,
        'item_number' => $item_number,
        'item_name' => $item_name,
        'item_name_jp' => $item_name_jp,
        'unit_price' => $row->get('unit_price'),
        'quantity' => $row->get('quantity'),
        'amount' => $row->get('amount'),
        'sales_tax' => 0,
        'shipment_plan_id' => $row->get('id'),
      ];

      // link_p_order_purchase
      if ($row->get('place_order_id')) {
        $link_p_order_purchase[] = [
          'place_order_id' => $row->get('place_order_id'),
          'purchase_id' => $id,
        ];
      }

      // link_p_order_purchase_detail
      if ($row->get('place_order_detail_id')) {
        $link_p_order_purchase_detail[] = [
          'place_order_detail_id' => $row->get('place_order_detail_id'),
          'purchase_detail_id' => $detail_id,
        ];
      }

      // moves
      $moves[] = [
        'job_date' => $row->get('shipment_plan_date'),
        'detail_kind' => 1,
        'purchase_id' => $id,
        'item_number' => $item_number,
        'quantity' => $row->get('quantity'),
      ];
    }

    return [
       'data' => $data,
       'details' => $details,
       'link_p_order_purchase' => $link_p_order_purchase,
       'link_p_order_purchase_detail' => $link_p_order_purchase_detail,
       'moves' => $moves,
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

    $c_shipment_plan_date_from = $cond->get('c_shipment_plan_date_from');
    if ($c_shipment_plan_date_from) {
      $query->where('shipment_plan_date', '>=', $c_shipment_plan_date_from);
    }

    $c_shipment_plan_date_to = $cond->get('c_shipment_plan_date_to');
    if ($c_shipment_plan_date_to) {
      $query->where('shipment_plan_date', '<=', $c_shipment_plan_date_to);
    }

    $c_item_number = $cond->get('c_item_number');
    if ($c_item_number) {
      $query->where('item_number', 'like', '%' . escape_like($c_item_number) . '%');
    }

    return $query;
  }

  /**
   * 商品を取得する
   * 
   * @return array
   */
  private function getItems()
  {
    $rows = DB::table('items')->get();
    return $rows->groupBy('id')->toArray();
  }

  /**
   * 発送仕入連結テーブルを登録する
   * 
   * @param array $rows
   */
  private function insertPlaceOrderPurchase($rows)
  {
    DB::table('link_p_order_purchase')->insert($rows);
  }

  /**
   * 発送仕入明細連結テーブルを登録する
   * 
   * @param array $rows
   */
  private function insertPlaceOrderDetailPurchaseDetail($rows)
  {
    DB::table('link_p_order_purchase_detail')->insert($rows);
  }

  /**
   * place_order_detailsのpurchasedを更新する
   */
  private function updatePlaceOrderDetailsPurchased()
  {
    DB::table('place_order_details')
      ->whereExists(function ($query) {
        $query->select(DB::raw(1))
          ->from('link_p_order_purchase_detail')
          ->whereRaw('link_p_order_purchase_detail.place_order_detail_id = place_order_details.id');
      })
      ->update(['purchased' => 1]);
  }

  /**
   * 入出庫データを登録する
   * 
   * @param array $moves
   */
  private function insertMoves(array $moves)
  {
    DB::table('inventory_moves')->insert($moves);
  }

  /**
   * 最新の棚卸データを取得
   *
   * @return Collection
   */
  private function getLatestInventories()
  {
    $rows = DB::table('inventories')
      ->select(
        'inventories.import_month',
        'inventories.item_number',
        'inventories.quantity'
      )
      ->join(DB::raw("(SELECT b.item_number, MAX(b.import_month) AS import_month FROM inventories b GROUP BY b.item_number) AS x"), function ($join) {
        $join->on('x.import_month', "=", 'inventories.import_month')
          ->on('x.item_number', "=", 'inventories.item_number');
      })
      ->get();
    return $rows;
  }

    /**
   * 入出庫データを取得する
   *
   * @param array $moves
   * @return Collection
   */
  private function getInventoryMoves($moves)
  {
    $rows = new Collection($moves);
    $data = $rows->map(function ($r) {
      $stocks = $r['quantity'];
      if ($r['detail_kind'] === 2) {
        $stocks = $stocks * -1;
      }
      return [
        'item_number' => $r['item_number'],
        'stocks' => $stocks
      ];
    });

    return $data->groupBy('item_number')->map(function($item) {
      return ['stocks' => $item->sum('stocks')];
    });
  }

  /**
   * 最新の棚卸データと増減をマージする
   *
   * @param Collection $latest 最新の棚卸データ
   * @param Collection $moves 増減データ
   * @return Collection
   */
  private function mergeLatestMoves($latest, $moves)
  {
    $item_numbers_moves = $moves->keys();

    $item_numbers = $item_numbers_moves->unique()->toArray();

    $latest_groups = $latest->groupBy('item_number')->toArray();
    $moves_groups = $moves->toArray();

    $data = [];
    foreach ($item_numbers as $item_number)
    {
      $quantity_latest = 0;
      if (isset($latest_groups[$item_number])) {
        $quantity_latest = $latest_groups[$item_number][0]->quantity;
      }

      $quantity_moves = 0;
      if (isset($moves_groups[$item_number])) {
        $quantity_moves = $moves_groups[$item_number]['stocks'];
      }

      $stocks = $quantity_latest + $quantity_moves;

      $data[] = [
        'item_number' => $item_number,
        'stocks' => $stocks,
      ];  
    }
    return $data;
  }
}