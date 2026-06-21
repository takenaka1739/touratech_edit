<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;

class PrefectureShippingRate extends Model
{
    protected $table = 'm_prefecture_shipping_rates';

    protected $fillable = [
        'prefecture',
        'amount',
        'sort_order',
    ];

    protected $casts = [
        'amount' => 'float',
        'sort_order' => 'integer',
    ];
}
