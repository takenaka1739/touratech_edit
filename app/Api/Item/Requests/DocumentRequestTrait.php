<?php

namespace App\Api\Item\Requests;

/**
 * 画像フォームバリデーション
 */
trait DocumentRequestTrait
{
  public function commonRules()
  {
    return [
      'item_id' => 'nullable|integer|exists:m_items,id',
      'type_status' => 'nullable|numeric|price',
      'type_name' => 'string|max:200',
      'file_name' => 'string|max:200',
    ];
  }

  public function attributes()
  {
    return [
      'item_id' => '商品ID',
      'type_status' => '題目ステータス',
      'type_name' => '題目名',
      'file_name' => 'ファイル名'
    ];
  }
}