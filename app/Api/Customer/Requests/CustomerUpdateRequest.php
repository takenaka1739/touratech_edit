<?php

namespace App\Api\Customer\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 得意先マスタ更新フォームバリデーション
 */
class CustomerUpdateRequest extends BaseRequest
{
  use CustomerRequestTrait;

  public function rules()
  {
    return $this->commonRules();
  }
}
