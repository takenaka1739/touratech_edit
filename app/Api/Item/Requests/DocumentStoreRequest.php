<?php

namespace App\Api\Item\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 商品分類マスタ登録フォームバリデーション
 */
class DocumentStoreRequest extends BaseRequest
{
  use DocumentRequestTrait;

  public function rules(): array
  {
    return $this->commonRules();
  }

}
