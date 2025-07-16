<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MImage extends Model
{
    use SoftDeletes;

    protected $table = 'm_images';

    protected $fillable = [
        'category_id',
        'item_id',
        'name',
        'order_by',
    ];

    protected $casts = [
        'category_id' => 'integer',
        'item_id'     => 'integer',
        'order_by'    => 'integer',
    ];

    public $timestamps = true;
}
