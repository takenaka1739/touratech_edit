<?php

namespace App\Api\Item\Requests;

/**
 * 画像フォームバリデーション
 */
trait ImageRequestTrait
{
  public function commonRules()
  {
    \Log::debug('デバッグ：ImageRequestTrait');

    return [
    //  //'id' => 'unsigned',
      'category_id' => 'nullable|integer|exists:m_categories,id',
      'item_id' => 'nullable|integer|exists:m_items,id',
      'name' => 'string|max:200',
      'order_by' => 'nullable|integer'
    ];
  }

  public function attributes()
  {
    return [
      'category_id' => '商品分類名ID',
      'item_id' => '商品ID',
      'name' => '商品分類名',
      'order_by' => '表示順'
    ];
  }
}