<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class Purchase extends Model
{
  protected $fillable = [
    'purchase_number',
    'purchase_date',
    'user_id',
    'total_amount',
    'remarks',
  ];

  protected $hidden = [
    'created_at',
    'updated_at',
  ];

  public function getPurchaseDateAttribute($value)
  {
    return $value ? Carbon::parse($value)->format('Y/m/d') : null;
  }

  /**
   * 明細に登録されている商品番号を取得する
   *
   * @return array
   */
  public function getItemNumbers()
  {
    $r = DB::table('purchase_details')
      ->select('item_number')
      ->where('purchase_id', '=', $this->id)
      ->whereIn('item_kind', [1, 3])
      ->get();

    return $r->pluck('item_number')->all();
  }
}
