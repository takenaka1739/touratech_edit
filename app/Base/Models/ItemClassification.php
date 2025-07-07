<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ItemClassification extends Model
{
  use SoftDeletes;

  protected $fillable = [
    'name',
    'remarks',
  ];

  protected $hidden = [
    'created_at',
    'updated_at',
    'deleted_at',
  ];
}
