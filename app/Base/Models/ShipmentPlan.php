<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class ShipmentPlan extends Model
{
  
  protected $table = 't_shipment_plans';
  public $timestamps = false;

  protected $fillable = [
    'shipment_plan_date',
    'item_number',
    'name',
    'unit_price',
    'quantity',
    'amount',
    'place_order_no',
  ];

  public function getShipmentPlanDateAttribute($value)
  {
    return $value ? Carbon::parse($value)->format('Y/m/d') : null;
  }
}
