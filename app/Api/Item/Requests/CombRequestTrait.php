<?php

namespace App\Api\Item\Requests;

/**
 * 画像フォームバリデーション
 */
trait CombRequestTrait
{
  public function commonRules()
  {
    return [
      'category_id' => 'nullable|integer|exists:m_categories,id',
      'item_id' => 'nullable|integer|exists:m_items,id',
    ];
  }

  public function attributes()
  {
    return [
      'category_id' => '商品分類名ID',
      'item_id' => '商品ID',
    ];
  }
}