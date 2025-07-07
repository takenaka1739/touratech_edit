<?php

namespace App\Api\PlaceOrder\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 発注データ登録フォームバリデーション
 */
class PlaceOrderStoreRequest extends BaseRequest
{
  use PlaceOrderRequestTrait;

  public function rules()
  {
    return [
      'receive_order_id' => 'nullable|integer|exists:receive_orders,id',
      'details.*.receive_order_detail_id' => 'nullable|integer|exists:receive_order_details,id',
    ] +  $this->commonRules();
  }
}
