<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;

class EstimateDetail extends Model
{
  /** 最小変更：実体テーブル名を明示 */
  protected $table = 't_estimate_details';

  public $timestamps = false;

  protected $fillable = [
    'estimate_id',
    'no',
    'item_kind',
    'item_id',
    'item_number',
    'item_name',
    'item_name_jp',
    'sales_unit_price',
    'rate',
    'fraction',
    'unit_price',
    'quantity',
    'discount',
    'amount',
    'sales_tax_rate',
    'sales_tax',
    'parent_id',
  ];
}
