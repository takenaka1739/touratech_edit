<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

class Config extends Model
{

  protected $table = 'm_configs';
  const CACHE_GET_SELF = 'configs.getSelf';


  protected $fillable = [
    'company_name',
    'zip_code',
    'address1',
    'address2',
    'tel',
    'fax',
    'email',
    'company_level',
    'bank_name1',
    'branch_name1',
    'account_name1',
    'account_type1',
    'account_number1',
    'bank_name2',
    'branch_name2',
    'account_name2',
    'account_type2',
    'account_number2',
    'sales_tax_rate',
    'pre_tax_rate',
    'tax_rate_change_date',
    'supplier_id',
    'send_trader',
    'send_personal',
    'send_price',
  ];

  protected $hidden = [
    'created_at',
    'updated_at',
    'deleted_at',
  ];

  public function getTaxRateChangeDateAttribute($value)
  {
    return $value ? Carbon::parse($value)->format('Y/m/d') : null;
  }

  public static function boot()
  {
    parent::boot();

    self::updated(function () {
      Cache::forget(self::CACHE_GET_SELF);
    });
  }

  /**
   * 消費税率を取得する
   *
   * @param string $date
   * @return int
   */
  public function getSalesTaxRate($date = null)
  {
    if ($date) {
      if (Carbon::parse($date) >= Carbon::parse($this->tax_rate_change_date)) {
        return $this->sales_tax_rate;
      } else {
        return $this->pre_tax_rate;
      }
    } else {
      return $this->sales_tax_rate;
    }
  }

  /**
   * 自社情報を取得する
   *
   * @return Config
   */
  public static function getSelf()
  {
    return Cache::rememberForever(self::CACHE_GET_SELF, function() {
      return Config::find(1);
    });
  }

  public static function getSupplierId()
  {
    $config = self::getSelf();
    return $config->supplier_id;
  }
}