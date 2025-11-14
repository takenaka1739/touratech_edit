<?php

namespace App\Api\Calendar\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 仕入先マスタ更新フォームバリデーション
 */
class CalendarUpdateRequest extends BaseRequest
{
  use CalendarRequestTrait;

  public function rules()
  {
    return $this->commonRules();
  }
}