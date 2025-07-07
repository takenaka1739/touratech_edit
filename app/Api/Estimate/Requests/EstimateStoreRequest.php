<?php

namespace App\Api\Estimate\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 見積データ登録フォームバリデーション
 */
class EstimateStoreRequest extends BaseRequest
{
  use EstimateRequestTrait;

  public function rules()
  {
    return $this->commonRules();
  }
}
