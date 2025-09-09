<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class SpecialSale extends Model
{

  protected $table = 't_special_sales';

  protected $fillable = [
    'item_id',
    'is_sales_members_only',
    'start_at',
    'end_at',
    'special_sale_price',
    'refund_rate',
  ];

  public function getShippingDateAttribute($value)
  {
    return $value ? Carbon::parse($value)->format('Y/m/d') : null;
  }
}
