<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class Sales extends Model
{
  protected $table = "sales";

  protected $fillable = [
    'sales_date',
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

  public function details()
  {
    return $this->hasMany('App\Base\Models\SalesDetail', 'sales_id');
  }

  public function getSalesDateAttribute($value)
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
    $r = DB::table('link_r_order_sales')
      ->select('receive_order_id')
      ->where('sales_id', $this->id)
      ->first();
    if ($r) {
      return $r->receive_order_id;
    } else {
      return null;
    }
  }

  /**
   * 明細に登録されている商品番号を取得する
   *
   * @return array
   */
  public function getItemNumbers()
  {
    $r = DB::table('sales_details')
      ->select('item_number')
      ->where('sales_id', '=', $this->id)
      ->whereIn('item_kind', [1, 3])
      ->get();

    return $r->pluck('item_number')->all();
  }
}
