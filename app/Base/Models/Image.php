<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

class Image extends Model
{
  use SoftDeletes;

  protected $table = 'm_images';

  protected $fillable = [
    //'id',
    'category_id',
    'item_id',
    'name',
    'order_by',
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
