<?php

namespace App\Api\Customer\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 得意先マスタ登録フォームバリデーション
 */
class CustomerStoreRequest extends BaseRequest
{
  use CustomerRequestTrait;

  public function rules()
  {
    return $this->commonRules();
  }
}
