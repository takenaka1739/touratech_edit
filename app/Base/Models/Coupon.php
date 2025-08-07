<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Coupon extends Model
{
    use SoftDeletes;

    protected $table = 'm_coupons';

    protected $fillable = [
        'code',
        'name',
        'details',
        'start_at',
        'end_at',
    ];

    protected $dates = [
        'start_at',
        'end_at',
        'deleted_at',
    ];

    protected $casts = [
        'condition_value' => 'array',
        'is_active' => 'boolean',
    ];

    
    public function rules()
    {
        return $this->hasMany(CouponRule::class, 'coupon_id');
    }
}
