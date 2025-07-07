<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;

class ReceiveOrderDetail extends Model
{
  public $timestamps = false;

  protected $fillable = [
    'receive_order_id',
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
    'amount',
    'sales_tax_rate',
    'sales_tax',
    'answer_date',
    'parent_id',
  ];
}
