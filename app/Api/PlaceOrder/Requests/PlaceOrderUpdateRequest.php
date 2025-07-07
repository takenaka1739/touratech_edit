<?php

namespace App\Api\PlaceOrder\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 発注データ更新フォームバリデーション
 */
class PlaceOrderUpdateRequest extends BaseRequest
{
  use PlaceOrderRequestTrait;

  public function rules()
  {
    return [
      'details.*.id' => 'nullable|integer',
    ] + $this->commonRules();
  }
}
