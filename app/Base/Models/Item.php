<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

class Item extends Model
{
  //use SoftDeletes;

  protected $table = 'm_items';

  //protected $fillable = [
  //  'item_number',
  //  'name',
  //  'name_jp',
  //  'name_label',
  //  'item_classification_id',
  //  'sales_unit_price',
  //  'purchase_unit_price',
  //  'sample_price',
  //  'supplier_id',
  //  'is_discontinued',
  //  'discontinued_date',
  //  'is_display',
  //  'is_set_item',
  //  'domestic_stock',
  //  'overseas_stock',
  //  'stock_display',
  //  'remarks'
  //];


    protected $fillable = [
      'supplier_id',
      'consumption_tax_id',
      'code',
      'name',
      'variation_code1',
      'variation_code2',
      'variation_code3',
      'variation_code4',
      'variations1',
      'variations2',
      'variations3',
      'variations4',
      'explanation',
      'explanation_details',
      'name_note',
      'name_label',
      'is_sell',
      'purchase_price',
      'sales_price',
      'sales_unit_price',
      'purchase_unit_price',
      'sample_price',
      'is_discountinued',
      'discountinued_at',
      'is_display',
      'is_point_rebates',
      'number_reservations',
      'is_shipping_fee',
      'is_cash_delivery_fee',
      'additional_shipping_fee',
      'is_special_sale',
      'is_payment_id1',
      'is_payment_id2',
      'is_payment_id3',
      'is_payment_id4',
      'is_payment_id5'
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
