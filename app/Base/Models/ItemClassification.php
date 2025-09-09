<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ItemClassification extends Model
{
    use SoftDeletes;

    protected $table = 'm_categories';

    protected $fillable = [
        'is_display',
        'code',
        'parent_code',
        'name',
        'remarks',
        'image'
        //'order_by',
    ];
    
    protected $hidden = [
        'created_at',
        'updated_at',
        'deleted_at',
    ];
}
