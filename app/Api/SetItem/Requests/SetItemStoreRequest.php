<?php

namespace App\Api\SetItem\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * セット品マスタ登録フォームバリデーション
 */
class SetItemStoreRequest extends BaseRequest
{
  use SetItemRequestTrait;

  public function rules()
  {
    return $this->commonRules();
  }
}
