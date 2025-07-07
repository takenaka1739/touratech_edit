<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ReceiveOrder extends Model
{
  protected $fillable = [
    'receive_order_date',
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

  public function getReceiveOrderDateAttribute($value)
  {
    return $value ? Carbon::parse($value)->format('Y/m/d') : null;
  }

  public function getDeliveryDateAttribute($value)
  {
    return $value ? Carbon::parse($value)->format('Y/m/d') : null;
  }

  /**
   * 明細毎の売上数量を取得する
   *
   * @param int $receive_order_id 受注ID
   * @return Collection
   */
  public static function getSalesQuantityGroups(int $receive_order_id)
  {
    $rows = DB::table('receive_orders as r')
      ->select([
        'rd.id as receive_detail_id',
        'rd.quantity as r_quantity',
        'sd.quantity as s_quantity',
      ])
      ->join('receive_order_details as rd', 'rd.receive_order_id', '=', 'r.id')
      ->leftJoin('link_r_order_sales_detail as l', 'l.receive_order_detail_id', '=', 'rd.id')
      ->leftJoin('sales_details as sd', 'sd.id', '=', 'l.sales_detail_id')
      ->where('r.id', '=', $receive_order_id)
      ->whereIn('rd.item_kind', [1, 2])
      ->get();

    return $rows->groupBy('receive_detail_id');
  }

  /**
   * 明細毎の発注数量を取得する
   *
   * @param int $receive_order_id 受注ID
   * @return Collection
   */
  public static function getPlaceQuantityGroups(int $receive_order_id)
  {
    $rows = DB::table('receive_orders as r')
      ->select([
        'rd.id as receive_detail_id',
        'rd.quantity as r_quantity',
        'pd.quantity as p_quantity',
      ])
      ->join('receive_order_details as rd', 'rd.receive_order_id', '=', 'r.id')
      ->leftJoin('link_r_order_p_order_detail as l', 'l.receive_order_detail_id', '=', 'rd.id')
      ->leftJoin('place_order_details as pd', 'pd.id', '=', 'l.place_order_detail_id')
      ->where('r.id', '=', $receive_order_id)
      ->whereIn('rd.item_kind', [1, 2])
      ->get();

    return $rows->groupBy('receive_detail_id');
  }

}
