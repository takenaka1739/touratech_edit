<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;

class CouponRule extends Model
{
    protected $table = 'm_coupon_rules';

    protected $fillable = [
        'coupon_id',
        'benefit_type',
        'benefit_value',
        'condition_type',
        'condition_value',
        'price_operator',
    ];

    protected $casts = [
        'condition_value' => 'array',
        'benefit_value'   => 'array',
    ];

    public $timestamps = true;
}
