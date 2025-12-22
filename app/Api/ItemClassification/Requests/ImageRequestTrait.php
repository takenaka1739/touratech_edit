<?php

namespace App\Api\ItemClassification\Requests;

use Illuminate\Validation\Rule;

/**
 * 画像フォームバリデーション
 */
trait ImageRequestTrait
{
  public function commonRules()
  {
    return [
      // m_images のカラムに対応
      'category_id' => ['nullable', 'integer', 'exists:m_categories,id'],
      'item_id'     => ['nullable', 'integer', 'exists:m_items,id'],
      'name'        => ['required', 'string', 'max:200'],
      'order_by'    => ['nullable', 'integer'],

      // 画像ファイル
      'file' => [
        'nullable',
        'file',
        'image',
        'mimes:jpg,jpeg,png,gif,webp',
        'max:10240',
      ],
    ];
  }

  public function attributes()
  {
    return [
      'category_id' => 'カテゴリID',
      'item_id'     => '商品ID',
      'name'        => '画像名',
      'order_by'    => '表示順',
      'file'        => '画像ファイル',
    ];
  }
}