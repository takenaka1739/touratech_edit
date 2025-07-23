<?php

namespace App\Api\Sales\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 売上データ登録フォームバリデーション
 */
class SalesStoreRequest extends BaseRequest
{
  use SalesRequestTrait;

  public function rules()
  {
    return [
      'receive_order_id' => 'nullable|integer|exists:receive_orders,id',
      'details.*.receive_order_detail_id' => 'nullable|integer|exists:receive_order_details,id',
    ] + $this->commonRules();
  }
}
