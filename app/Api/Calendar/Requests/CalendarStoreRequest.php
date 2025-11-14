<?php

namespace App\Api\Calendar\Requests;

use App\Base\Http\Requests\Api\BaseRequest;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * カレンダーマスタ登録フォームバリデーション
 */
class CalendarStoreRequest extends BaseRequest
{
  use CalendarRequestTrait;

  public function rules()
  {
    return $this->commonRules();
  }
}
