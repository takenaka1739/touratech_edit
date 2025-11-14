<?php

namespace App\Api\Item\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 商品分類マスタ更新フォームバリデーション
 */
class ImageUpdateRequest extends BaseRequest
{
  use ImageRequestTrait;

  public function rules()
  {
    return $this->commonRules();
  }
}
