<?php

namespace App\Api\User\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 担当者マスタ登録フォームバリデーション
 */
class UserStoreRequest extends BaseRequest
{
  use UserRequestTrait;

  public function rules()
  {
    return $this->commonRules();
  }
}
