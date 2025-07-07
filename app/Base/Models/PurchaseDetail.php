<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseDetail extends Model
{
  public $timestamps = false;

  protected $fillable = [
    'purchase_id',
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
    'parent_id',
  ];
}
