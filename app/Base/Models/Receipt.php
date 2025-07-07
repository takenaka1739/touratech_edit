<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Receipt extends Model
{
  protected $fillable = [
    'receipt_date',
    'customer_id',
    'customer_name',
    'user_id',
    'total_amount',
    'remarks',
  ];

  protected $hidden = [
    'created_at',
    'updated_at',
  ];

  public function getReceiptDateAttribute($value)
  {
    return $value ? Carbon::parse($value)->format('Y/m/d') : null;
  }
}
