<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class ShipmentPlan extends Model
{
  public $timestamps = false;

  protected $fillable = [
    'shipment_plan_date',
    'item_number',
    'item_name',
    'unit_price',
    'quantity',
    'amount',
  ];

  public function getShipmentPlanDateAttribute($value)
  {
    return $value ? Carbon::parse($value)->format('Y/m/d') : null;
  }
}
