<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class InvoiceDetail extends Model
{
  public $timestamps = false;

  protected $fillable = [
    'invoice_id',
    'no',
    'job_date',
    'detail_kind',
    'item_kind',
    'item_id',
    'item_name',
    'fraction',
    'unit_price',
    'quantity',
    'amount',
    'sales_tax_rate',
    'sales_tax',
    'parent_id',
  ];

  public function getJobDateAttribute($value)
  {
      return $value ? Carbon::parse($value)->format('Y/m/d') : null;
  }
}
