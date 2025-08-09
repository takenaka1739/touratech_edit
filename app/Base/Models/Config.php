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
        'tax_rate_change_at',
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

    // 本体は Y-m-d を返す
    protected $casts = [
        'tax_rate_change_at' => 'datetime:Y-m-d',
    ];

    // 配列/JSONに“表示用”プロパティを追加（react-datepicker向けに yyyy/MM/dd）
    protected $appends = [
        'tax_rate_change_at_form',
    ];

    public static function boot()
    {
        parent::boot();

        self::updated(function () {
            Cache::forget(self::CACHE_GET_SELF);
        });
    }

    /**
     * 表示用アクセサ： tax_rate_change_at_form (yyyy/MM/dd)
     */
    public function getTaxRateChangeAtFormAttribute(): ?string
    {
        $v = $this->getAttribute('tax_rate_change_at');
        if (!$v) return null;

        $c = $v instanceof Carbon ? $v : Carbon::parse($v);
        return $c->format('Y/m/d');
    }

    /**
     * セッタ：スラッシュ/ハイフンどちらでも受け取り、Y-m-dに正規化
     */
    public function setTaxRateChangeAtAttribute($value): void
    {
        if (empty($value)) {
            $this->attributes['tax_rate_change_at'] = null;
            return;
        }
        $s = is_string($value) ? str_replace('/', '-', $value) : $value;
        $this->attributes['tax_rate_change_at'] = Carbon::parse($s)->format('Y-m-d');
    }

    /**
     * 消費税率を取得する
     */
    public function getSalesTaxRate($date = null)
    {
        if ($date) {
            return Carbon::parse($date) >= Carbon::parse($this->tax_rate_change_at)
                ? $this->sales_tax_rate
                : $this->pre_tax_rate;
        }
        return $this->sales_tax_rate;
    }

    /**
     * 自社情報を取得する
     *
     * @return Config
     */
    public static function getSelf()
    {
        return Cache::rememberForever(self::CACHE_GET_SELF, function () {
            return Config::find(1);
        });
    }

    public static function getSupplierId()
    {
        $config = self::getSelf();
        return $config->supplier_id;
    }
}
