<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class Shipping extends Model
{
  public $timestamps = false;

  protected $fillable = [
    'item_id',
    'shipping_date',
    'shipping_year_month',
    'quantity',
  ];

  public function getShippingDateAttribute($value)
  {
    return $value ? Carbon::parse($value)->format('Y/m/d') : null;
  }
}
