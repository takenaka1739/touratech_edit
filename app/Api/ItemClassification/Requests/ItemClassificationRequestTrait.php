<?php

namespace App\Api\ItemClassification\Requests;

/**
 * 商品分類マスタ共通フォームバリデーション
 */
trait ItemClassificationRequestTrait
{
  public function commonRules()
  {
\Log::debug('デバッグ：ItemClassificationStoreRequest');

    return [
      //'id' => 'unsigned',
      'name' => 'required|string|max:30',
      'is_display' => 'boolean',
      'code' => 'nullable|string|max:30',
      'parent_code' => 'nullable|string|max:30',
      //'image' => 'required|string|max:30',
      'remarks' => 'nullable|string|max:200',
    ];
  }

  public function attributes()
  {
    return [
      'name' => '商品分類名',
      'remarks' => '備考',
    ];
  }
}