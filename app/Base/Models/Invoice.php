<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Invoice extends Model
{
  public $timestamps = false;

  protected $fillable = [
    'invoice_date',
    'invoice_month',
    'customer_id',
    'customer_name',
    'zip_code',
    'address1',
    'address2',
    'tel',
    'fax',
    'user_id',
    'pre_amount',
    'total_receipt',
    'carried_forward',
    'total_amount',
    'total_tax',
    'total_invoice',
    'remarks',
  ];

  public function getInvoiceDateAttribute($value)
  {
    return $value ? Carbon::parse($value)->format('Y/m/d') : null;
  }

  public function details()
  {
    return $this->hasMany('App\Base\Models\InvoiceDetail', 'invoice_id', 'id')
      ->orderBy('job_date')
      ->orderBy('id');
  }
}
