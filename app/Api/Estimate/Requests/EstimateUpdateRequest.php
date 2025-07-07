<?php

namespace App\Api\Estimate\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 見積データ更新フォームバリデーション
 */
class EstimateUpdateRequest extends BaseRequest
{
  use EstimateRequestTrait;

  public function rules()
  {
    return [
      'details.*.id' => 'nullable|integer',
    ] + $this->commonRules();
  }
}
