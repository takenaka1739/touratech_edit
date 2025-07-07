<?php

namespace App\Api\ReceiveOrder\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 受注データ登録フォームバリデーション
 */
class ReceiveOrderStoreRequest extends BaseRequest
{
  use ReceiveOrderRequestTrait;

  public function rules()
  {
    return [
      'estimate_id' => 'nullable|integer|exists:estimates,id',
      'details.*.estimate_detail_id' => 'nullable|integer|exists:estimate_details,id',
    ] +$this->commonRules();
  }
}
