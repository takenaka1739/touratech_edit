<?php

namespace App\Api\ReceiveOrder\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 受注データ更新フォームバリデーション
 */
class ReceiveOrderUpdateRequest extends BaseRequest
{
  use ReceiveOrderRequestTrait;

  public function rules()
  {
    return [
      'details.*.id' => 'nullable|integer',
    ] + $this->commonRules();
  }
}
