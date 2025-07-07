<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
  use SoftDeletes;

  protected $fillable = [
    'name',
    'kana',
    'zip_code',
    'address1',
    'address2',
    'tel',
    'fax',
    'email',
    'fraction',
    'corporate_class',
    'bank_class',
    'cutoff_date',
    'rate',
    'remarks',
  ];

  protected $hidden = [
    'created_at',
    'updated_at',
    'deleted_at',
  ];
}
