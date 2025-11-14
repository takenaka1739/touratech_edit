<?php

namespace App\Api\Item\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 商品分類マスタ登録フォームバリデーション
 */
class CombStoreRequest extends BaseRequest
{
  use CombRequestTrait;

  public function rules(): array
  {
    return $this->commonRules();
  }

}
