<?php

namespace App\Api\SetItem\Requests;

/**
 * セット品マスタ共通フォームバリデーション
 */
trait SetItemRequestTrait
{
  public function commonRules()
  {
    return [
      'item_number' => 'bail|required|string|max:50|unique:items',
      'name_jp' => 'required|string|max:200',
      'sales_unit_price' => 'required|numeric|price',
      'discontinued_date' => 'nullable|date',
      'is_display' => 'required|boolean',
      'details' => 'required',
      'details.*.id' => 'required|integer',
      'details.*.item_id' => 'required|integer|exists:items,id',
      'details.*.quantity' => 'required|integer|between:0,999',
      'details.*.set_price' => 'required|numeric|price'
    ];
  }

  public function attributes()
  {
    return [
      'item_number' => 'セット品番',
      'name_jp' => 'セット品名',
      'sales_unit_price' => 'セット単価',
      'discontinued_date' => '廃盤日',
      'is_display' => '表示',
      'details.*.id' => '品番',
      'details.*.item_id' => '品番',
      'details.*.quantity' => '数量',
      'details.*.set_price' => '売上単価（セット時）',
      'details' => '明細',
    ];
  }
}