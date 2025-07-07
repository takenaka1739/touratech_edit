<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
  use SoftDeletes;

  protected $fillable = [
    'name',
    'zip_code',
    'address1',
    'address2',
    'tel',
    'fax',
    'email',
    'foreign_currency_type',
    'fraction',
    'output_no',
    'remarks',
  ];

  protected $hidden = [
    'created_at',
    'updated_at',
    'deleted_at',
  ];
}
