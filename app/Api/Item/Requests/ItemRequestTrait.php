<?php

namespace App\Api\Item\Requests;

use Illuminate\Validation\Rule;

/**
 * 商品マスタ共通フォームバリデーション
 */
trait ItemRequestTrait
{
  public function commonRules()
  {
    $id = $this->route('id');
    \Log::debug('$id');
    \Log::debug($id);
    return [
      'supplier_id' => 'bail|nullable|integer|exists:m_suppliers,id',
      'consumption_tax_id' => 'bail|nullable|integer|exists:t_consumption_taxes,id',
      'code' => 'required|string|max:30',
      'name' => 'required|string|max:400',
      'item_number'=> [
        'bail',
        'required',
        'string',
        'max:50',
        Rule::unique('m_items', 'item_number')
            ->where(fn($q) => $q->whereNull('deleted_at'))
            ->ignore($id)
        //Rule::unique('m_items', 'item_number')->where(function ($q) {
        //  return $q->whereNull('deleted_at');
        //})->ignore($id)
      ],
      'variations1' => 'nullable|string|max:50',
      'variations2' => 'nullable|string|max:50',
      'variations3' => 'nullable|string|max:50',
      'variations4' => 'nullable|string|max:50',
      'explanation' => 'nullable|string|max:500',
      'explanation_details' => 'nullable|string|max:500',
      'name_note' => 'nullable|string|max:400',
      'name_label' => 'nullable|string|max:400',
      'is_sell' => 'required|boolean',
      'purchase_price' => 'nullable|numeric|price',
      'sales_price' => 'nullable|numeric|price',
      'sales_unit_price' => 'nullable|numeric|price',
      'purchase_unit_price' => 'nullable|numeric|price',
      'sample_price' => 'nullable|numeric|price',
      'is_discontinued' => 'required|boolean',
      'discontinued_at' => 'nullable|string|max:36',
      'is_display' => 'required|boolean',
      'domestic_stocks' => 'nullable|numeric|price',
      'overseas_stocks' => 'nullable|numeric|price',
      'display_status' => 'nullable|numeric|price',
      'remarks' => 'nullable|string|max:500',
      'number_reservations' => 'nullable|numeric|price',
      'is_shipping_fee' => 'required|boolean',
      'is_cash_delivery_fee' => 'required|boolean',
      'additional_shipping_fee' => 'nullable|numeric|price',
      'is_point_rebates' => 'required|boolean',
      'is_payment_id1' => 'required|boolean',
      'is_payment_id2' => 'required|boolean',
      'is_payment_id3' => 'required|boolean',
      'is_payment_id4' => 'required|boolean',
      'is_payment_id5' => 'required|boolean',
      'shipping_pay' => 'nullable|numeric|price',
    ];
  }

  public function attributes()
  {
    return [
      'item_number' => '品番',
      'name' => '商品名',
      'name_note' => '商品名（納品書）',
      'name_label' => '商品名（ラベル用）',
      'category_id' => '商品分類',
      'sales_unit_price' => '売上単価',
      'purchase_unit_price' => '仕入単価',
      'sample_price' => 'サンプル品単価',
      'supplier_id' => '仕入先',
      'is_discontinued' => '廃盤予定',
      'discontinued_date' => '廃盤日',
      'is_display' => '表示',
      'stock_display' => '在庫表示',
      'remarks' => '備考',
    ];
  }
}