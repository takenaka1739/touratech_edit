<?php

namespace App\Base\Models;

use Exception;
use Illuminate\Database\Eloquent\Model;

class ConfigCod extends Model
{
  protected $table = 't_config_cods';

  protected $fillable = [
    'border',
    'amount',
  ];

  public $timestamps = false;
}