<?php

namespace App\Base\Models;

use Exception;
use Illuminate\Database\Eloquent\Model;

class ConfigCurrency extends Model
{
  protected $fillable = [
    'name',
    'rate',
  ];

  public $timestamps = false;

  public static function getEuroRate()
  {
    $row = ConfigCurrency::select('rate')
      ->where('name', 'ユーロ')
      ->first();

    if (!$row) {
      throw new Exception('通貨換算の取得に失敗しました');
    }

    return $row->rate;
  }
}