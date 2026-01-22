<?php

namespace App\Api\InventoryPrinting\Services;

use App\Base\Models\Inventory;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * 在庫表印刷サービス
 */
class InventoryPrintingService
{
  /**
   * PDF/Excel用のデータを取得する
   *
   * @param array $cond 条件
   * @return array
   */
  public function getPdfData(array $cond)
  {
    $cond = new Collection($cond);
    $import_month = $cond->get('import_month');

    $inventories = $this->getInventories($import_month);
    $pre_inventories = $this->getPreInventories($import_month);
    $moves = $this->getMoves($import_month);

    // 棚卸データ、前月の棚卸データ、入出庫データから商品IDを取得する
    $item_numbers = $this->getItemNumbers($inventories, $pre_inventories, $moves);

    $inventory_groups = $inventories->groupBy('item_number')->toArray();
    $pre_inventory_groups = $pre_inventories->groupBy('item_number')->toArray();

    $data = [];
    foreach ($item_numbers as $item_number) {
      $inventory = null;
      if (isset($inventory_groups[$item_number])) {
        $inventory = $inventory_groups[$item_number][0];
      }
      $pre_inventory = null;
      if (isset($pre_inventory_groups[$item_number])) {
        $pre_inventory = $pre_inventory_groups[$item_number][0];
      }
      $move = $moves->get($item_number);

      $item_name = "";
      $unit_price = 0;

      // 旧版互換：Eloquent(Model) を前提に配列アクセスを維持
      if ($inventory) {
        $item_name = $inventory['name'] ?? '';
        $unit_price = (float)($inventory['purchase_unit_price'] ?? 0);
      } elseif ($pre_inventory) {
        $item_name = $pre_inventory['name'] ?? '';
        $unit_price = (float)($pre_inventory['purchase_unit_price'] ?? 0);
      }

      $pre_quantity = 0;
      if ($pre_inventory) {
        $pre_quantity = (int)($pre_inventory['quantity'] ?? 0);
      }

      $in = 0;
      $out = 0;
      if ($move) {
        $in = (int)($move["in"] ?? 0);
        $out = (int)($move["out"] ?? 0);
      }

      // 現行仕様：前月棚卸 + 今月入出庫 で “今月在庫” を算出（当月棚卸 quantity は使わない）
      $quantity = $pre_quantity + $in - $out;

      $data[] = [
        'item_number' => $item_number,
        'item_name' => $item_name,
        'pre_quantity' => $pre_quantity,
        'in' => $in,
        'out' => $out,
        'quantity' => $quantity,
        'unit_price' => $unit_price,
        'amount' => $quantity * $unit_price,
      ];
    }

    return [
      'import_month' => $import_month,
      'data' => $data,
    ];
  }

  /**
   * 棚卸取込データ（t_inventories）を取得する
   *
   * 旧版互換方針：
   * - DB::table() は stdClass を返し、配列アクセス($row['name'])で落ちるため、
   *   Eloquent(Inventory) で取得して Model(ArrayAccess) を維持する。
   * - 在庫表で参照しているキー 'name' に合わせて AS name を付与する。
   *
   * @param string $import_month 対象年月（YYYY/MM）
   * @return \Illuminate\Support\Collection
   */
  private function getInventories($import_month)
  {
    return Inventory::query()
      ->select([
        't_inventories.item_number',
        't_inventories.quantity',
        // 在庫表側の参照キーは 'name' のため AS name に揃える（現行仕様）
        DB::raw('COALESCE(m_items.name_note, "") AS name'),
        'm_items.purchase_unit_price',
      ])
      ->where('t_inventories.import_month', '=', $import_month)
      ->leftJoin('m_items', 'm_items.item_number', '=', 't_inventories.item_number')
      ->get();
  }

  /**
   * 前月の棚卸データを取得する
   *
   * @param string $import_month 対象年月（YYYY/MM）
   * @return \Illuminate\Support\Collection
   */
  private function getPreInventories($import_month)
  {
    $dt = Carbon::parse($import_month . "/01");
    $pre_month = $dt->subMonth()->format('Y/m');

    return $this->getInventories($pre_month);
  }

  /**
   * 入出庫データを取得する（t_inventory_moves）
   *
   * @param string $import_month 対象年月（YYYY/MM）
   * @return \Illuminate\Support\Collection
   */
  private function getMoves($import_month)
  {
    $date_from = $import_month . "/01";

    $dt = new Carbon($date_from);
    $date_to = $dt->addMonth()->format("Y/m/d");

    $rows = DB::table('t_inventory_moves')
      ->select([
        'item_number',
        'detail_kind',
        DB::raw('SUM(quantity) AS quantity'),
      ])
      ->where('job_date', '>=', $date_from)
      ->where('job_date', '<', $date_to)
      ->groupBy('item_number', 'detail_kind')
      ->get();

    return $rows->groupBy('item_number')->map(function ($item) {
      return [
        'in' => (int)$item->where('detail_kind', 1)->sum('quantity'),
        'out' => (int)$item->where('detail_kind', 2)->sum('quantity'),
      ];
    });
  }

  /**
   * 棚卸データ、前月の棚卸データ、入出庫データから商品IDを取得する
   *
   * @param \Illuminate\Support\Collection $inventories
   * @param \Illuminate\Support\Collection $pre_inventories
   * @param \Illuminate\Support\Collection $moves
   * @return \Illuminate\Support\Collection
   */
  private function getItemNumbers($inventories, $pre_inventories, $moves)
  {
    $keys_inventories = $inventories->groupBy('item_number')->keys();
    $keys_pre = $pre_inventories->groupBy('item_number')->keys();
    $keys_moves = $moves->keys();

    return $keys_inventories->merge($keys_pre)->merge($keys_moves)->unique();
  }
}
