<?php

namespace App\Api\Item\Requests;

use Illuminate\Validation\Rule;

/**
 * 商品マスタ共通フォームバリデーション
 */
trait SpecialSaleRequestTrait
{
  public function commonRules()
  {
    return [
      'item_id' => 'nullable|integer|exists:m_items,id',
      'is_sales_members_only' => 'nullable|boolean',
      'start_at' => 'nullable|date',
      'end_at' => 'nullable|date',
      'special_sale_price' => 'nullable|numeric|price',
      'refund_rate' => 'nullable|numeric|price'
    ];
  }

  public function attributes()
  {
    return [
      'item_id' => '商品ID',
      'is_sales_members_only' => '会員のみ',
      'start_at' => '開始日',
      'end_at' => '終了日',
      'special_sale_price' => 'セール価格',
    ];
  }
}