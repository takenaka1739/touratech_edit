<?php

namespace App\Api\ItemClassification\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 商品分類マスタ更新フォームバリデーション
 */
class ItemClassificationUpdateRequest extends BaseRequest
{
  use ItemClassificationRequestTrait;

  public function rules()
  {
    return $this->commonRules();
  }
}
