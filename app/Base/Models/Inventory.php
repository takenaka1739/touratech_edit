<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Inventory extends Model
{
  /**
   * 注意:
   * Laravel の規約では Inventory -> inventories テーブルを参照するため、
   * 実テーブル t_inventories を明示する。
   */
  protected $table = 't_inventories';

  public $timestamps = false;

  protected $fillable = [
    'import_month',
    'item_number',
    'quantity',
  ];

  /**
   * 商品の最新の在庫を取得する
   *
   * @param array $item_numbers
   * @return \Illuminate\Support\Collection
   */
  public static function getLatestInventories(array $item_numbers)
  {
    $rows = DB::table('t_inventories')
      ->select([
        't_inventories.import_month',
        't_inventories.item_number',
        't_inventories.quantity'
      ])
      ->join(DB::raw("(SELECT b.item_number, MAX(b.import_month) AS import_month FROM t_inventories b GROUP BY b.item_number) AS x"), function ($join) {
        $join->on('x.import_month', "=", 't_inventories.import_month')
          ->on('x.item_number', "=", 't_inventories.item_number');
      })
      ->whereIn('t_inventories.item_number', $item_numbers)
      ->get();

    return $rows->groupBy('item_number');
  }
}
