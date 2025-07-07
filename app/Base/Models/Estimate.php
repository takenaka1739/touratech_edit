<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Estimate extends Model
{
  protected $fillable = [
    'estimate_date',
    'delivery_date',
    'customer_id',
    'customer_name',
    'send_flg',
    'name',
    'zip_code',
    'address1',
    'address2',
    'tel',
    'fax',
    'corporate_class',
    'user_id',
    'order_no',
    'shipping_amount',
    'fee',
    'discount',
    'total_amount',
    'remarks',
    'rate',
    'fraction',
  ];

  protected $hidden = [
    'created_at',
    'updated_at',
  ];

  public function getEstimateDateAttribute($value)
  {
    return $value ? Carbon::parse($value)->format('Y/m/d') : null;
  }

  public function getDeliveryDateAttribute($value)
  {
    return $value ? Carbon::parse($value)->format('Y/m/d') : null;
  }
}
