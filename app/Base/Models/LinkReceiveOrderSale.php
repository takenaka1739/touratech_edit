<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * 受注と売上の紐づけ
 */
class LinkReceiveOrderSale extends Model
{
    use HasFactory;

    protected $table = 't_link_r_order_sales';

    protected $fillable = [
        'receive_order_id',
        'sales_id',
    ];

    protected $casts = [
        'receive_order_id' => 'integer',
        'sales_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
