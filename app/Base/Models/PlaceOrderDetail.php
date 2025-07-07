<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;

class PlaceOrderDetail extends Model
{
  public $timestamps = false;

  protected $fillable = [
    'place_order_id',
    'no',
    'item_kind',
    'item_id',
    'item_number',
    'item_name',
    'item_name_jp',
    'fraction',
    'unit_price',
    'quantity',
    'amount',
    'sales_tax_rate',
    'sales_tax',
    'place_order_no',
    'purchased',
    'parent_id',
  ];
}
