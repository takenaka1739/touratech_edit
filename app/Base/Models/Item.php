<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class Item extends Model
{
  use SoftDeletes;

  protected $fillable = [
    'item_number',
    'name',
    'name_jp',
    'name_label',
    'item_classification_id',
    'sales_unit_price',
    'purchase_unit_price',
    'sample_price',
    'supplier_id',
    'is_discontinued',
    'discontinued_date',
    'is_display',
    'is_set_item',
    'domestic_stock',
    'overseas_stock',
    'stock_display',
    'remarks',
  ];

  protected $hidden = [
    'created_at',
    'updated_at',
    'deleted_at',
  ];

  public function getDiscontinuedDateAttribute($value)
  {
    return $value ? Carbon::parse($value)->format('Y/m/d') : null;
  }

  /**
   * セット品の明細を取得する
   *
   * @param int $item_id
   * @return Collection
   */
  public static function getSetItems(int $item_id)
  {
    return DB::table('set_item_details')
      ->select(
        'items.*',
        'set_item_details.quantity',
        'set_item_details.set_price',
      )
      ->join('items', 'items.id', '=', 'set_item_details.item_id')
      ->where('set_item_id', $item_id)
      ->get();
  }
}
