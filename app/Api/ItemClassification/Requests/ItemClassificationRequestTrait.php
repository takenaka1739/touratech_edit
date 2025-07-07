<?php

namespace App\Api\ItemClassification\Requests;

/**
 * 商品分類マスタ共通フォームバリデーション
 */
trait ItemClassificationRequestTrait
{
  public function commonRules()
  {
    return [
      'name' => 'required|string|max:30',
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