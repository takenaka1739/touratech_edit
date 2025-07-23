<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DeliveryAddress extends Model
{
    use SoftDeletes;

    protected $table = 'm_delivery_addresses';

    protected $fillable = [
        'customer_id',
        'is_default',
        'zip_code',
        'prefectures',
        'municipality',
        'number',
        'recipient_name',
        'tel',
        'tel_phone',
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];
}
