<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

class Item extends Model
{
    use SoftDeletes;

    protected $table = 'm_items';

    protected $fillable = [
        'code',
        'name',
        'name_label',
        'category_id',
        'sales_unit_price',
        'purchase_unit_price',
        'sample_price',
        'supplier_id',
        'is_discontinued',
        'discontinued_at',
        'is_display',
        'is_set_item',
        'stock_display',
        'remarks',
    ];

    protected $hidden = [
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    public function getDiscontinuedDateAttribute($value)
    {
        return $value ? Carbon::parse($value)->format('Y/m/d') : null;
    }
}
