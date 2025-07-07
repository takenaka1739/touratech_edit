<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryMove extends Model
{
  const EDIT_KIND_PURCHASE = 1;
  const EDIT_KIND_SALES = 2;

  public $timestamps = false;

  protected $fillable = [
    'job_date',
    'detail_kind',
    'sales_id',
    'purchase_id',
    'item_number',
    'quantity',
  ];


  /**
   * 対象年月以降の対象品番の数量を取得する
   *
   * @param string $import_month
   * @param string $item_number
   * @return int
   */
  public static function getQuantity($import_month, string $item_number)
  {
    $sales = 0;
    $purchase = 0;

    $m = InventoryMove::where('item_number', $item_number)->first();
    if ($m) {
      $sales = $m->getQuery($import_month)
        ->where('detail_kind', '=', self::EDIT_KIND_SALES)->get()->sum('quantity');

      $purchase = $m->getQuery($import_month)
        ->where('detail_kind', '=', self::EDIT_KIND_PURCHASE)->get()->sum('quantity');
    }

    return $purchase - $sales;
  }

  /**
   *
   * @param string $import_month
   * @return \Illuminate\Database\Query\Builder
   */
  public function getQuery($import_month)
  {
    $query = $this->select('quantity')
      ->where('item_number', '=', $this->item_number);
    if ($import_month) {
      $query->where('job_date', '>=', $import_month . "/01");
    }
    return $query;
  }
}
