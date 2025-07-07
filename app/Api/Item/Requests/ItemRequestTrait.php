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
    return [
      'item_number' => [
        'bail',
        'required',
        'string',
        'max:50',
        Rule::unique('items', 'item_number')->where(function ($q) {
          return $q->whereNull('deleted_at');
        })
      ],
      'name' => 'required|string|max:400',
      'name_jp' => 'required|string|max:400',
      'name_label' => 'nullable|string|max:36',
      'item_classification_id' => 'bail|nullable|integer|exists:item_classifications,id',
      'sales_unit_price' => 'nullable|numeric|price',
      'purchase_unit_price' => 'nullable|numeric|price',
      'sample_price' => 'nullable|numeric|price',
      'supplier_id' => 'required|integer|exists:suppliers,id',
      'is_discontinued' => 'required|boolean',
      'discontinued_date' => 'nullable|date',
      'is_display' => 'required|boolean',
      'stock_display' => [
        'required',
        'integer',
        Rule::in([1, 2, 3]),
      ],
      'remarks' => 'nullable|string|max:200',
    ];
  }

  public function attributes()
  {
    return [
      'item_number' => '品番',
      'name' => '商品名',
      'name_jp' => '商品名（納品書）',
      'name_label' => '商品名（ラベル用）',
      'item_classification_id' => '商品分類',
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