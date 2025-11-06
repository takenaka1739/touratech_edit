<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ItemCategoryCombination extends Model
{
    use SoftDeletes;

    protected $table = 't_category_item_combinations';

    protected $fillable = [
        'category_id',
        'item_id',
    ];
    
    protected $hidden = [
        'created_at',
        'updated_at',
        'deleted_at',
    ];
}