<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class Receiving extends Model
{
  public $timestamps = false;

  protected $fillable = [
    'item_id',
    'receiving_date',
    'receiving_year_month',
    'quantity',
  ];

  public function getReceivingDateAttribute($value)
  {
    return $value ? Carbon::parse($value)->format('Y/m/d') : null;
  }
}
