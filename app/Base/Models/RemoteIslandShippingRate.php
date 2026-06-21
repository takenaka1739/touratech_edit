<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;

class RemoteIslandShippingRate extends Model
{
    protected $table = 'm_remote_island_shipping_rates';

    protected $fillable = [
        'prefecture',
        'municipality',
        'area_names',
        'amount',
        'sort_order',
    ];

    protected $casts = [
        'amount' => 'float',
        'sort_order' => 'integer',
    ];
}
