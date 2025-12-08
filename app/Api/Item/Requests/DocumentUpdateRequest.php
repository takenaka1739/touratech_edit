<?php

namespace App\Api\Item\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 商品分類マスタ更新フォームバリデーション
 */
class DocumentUpdateRequest extends BaseRequest
{
  use DocumentRequestTrait;

  public function rules()
  {
    return $this->commonRules();
  }
}
