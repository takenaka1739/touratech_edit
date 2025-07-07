<?php

namespace App\Api\PlaceOrder\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * メール送信バリデーション
 */
class PlaceOrderSendingMailRequest extends BaseRequest
{
  public function rules()
  {
    return [
      'id' => 'required|integer|exists:place_orders,id',
    ];
  }

  public function attributes()
  {
    return [
      'id' => 'ID',
    ];
  }
}
