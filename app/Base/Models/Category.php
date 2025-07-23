<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Category extends Model
{
    protected $table = 'm_categories';

    protected $fillable = [
        'is_display',
        'code',
        'parent_code',
        'name',
        'url'
    ];
}
