<?php

namespace App\Api\Purchase\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 仕入データ更新フォームバリデーション
 */
class PurchaseUpdateRequest extends BaseRequest
{
  use PurchaseRequestTrait;

  public function rules()
  {
    return [
      'details.*.id' => 'nullable|integer',
    ] + $this->commonRules();
  }
}
