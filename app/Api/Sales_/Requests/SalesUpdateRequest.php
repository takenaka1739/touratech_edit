<?php

namespace App\Api\Sales\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 売上データ更新フォームバリデーション
 */
class SalesUpdateRequest extends BaseRequest
{
  use SalesRequestTrait;

  public function rules()
  {
    return [
      'details.*.id' => 'nullable|integer',
    ] + $this->commonRules();
  }
}
