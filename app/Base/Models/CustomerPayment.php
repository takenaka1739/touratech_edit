<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CustomerPayment extends Model
{
  use SoftDeletes;

  protected $table = 't_customer_payments';

  protected $fillable = [
    'customer_id',
    'square_customer_id',
    'card_id',
    'method_code',
    'is_default',
    'last_four_digit',
    'card_company',
    'month',
    'year',
    'account_name',
  ];
}
