<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class PlaceOrder extends Model
{
  protected $fillable = [
    'place_order_date',
    'user_id',
    'delivery_day',
    'total_amount',
    'remarks',
    'fraction',
    'order_file_name',
  ];

  protected $hidden = [
    'created_at',
    'updated_at',
  ];

  public function getPlaceOrderDateAttribute($value)
  {
    return $value ? Carbon::parse($value)->format('Y/m/d') : null;
  }

  /**
   * 紐づいている受注IDを取得する
   *
   * @return int|null
   */
  public function getReceiveOrderId()
  {
    $r = DB::table('link_r_order_p_order')
      ->select('receive_order_id')
      ->where('place_order_id', $this->id)
      ->first();
    if ($r) {
      return $r->receive_order_id;
    } else {
      return null;
    }
  }
}
