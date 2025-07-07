<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Inventory extends Model
{
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
   * @return Collection
   */
  public static function getLatestInventories(array $item_numbers)
  {
    $rows = DB::table('inventories')
      ->select([
        'inventories.import_month',
        'inventories.item_number',
        'inventories.quantity'
      ])
      ->join(DB::raw("(SELECT b.item_number, MAX(b.import_month) AS import_month FROM inventories b GROUP BY b.item_number) AS x"), function ($join) {
        $join->on('x.import_month', "=", 'inventories.import_month')
          ->on('x.item_number', "=", 'inventories.item_number');
      })
      ->whereIn('inventories.item_number', $item_numbers)
      ->get();

    return $rows->groupBy('item_number');
  }
}
