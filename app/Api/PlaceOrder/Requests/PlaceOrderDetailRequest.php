<?php

namespace App\Api\PlaceOrder\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 発注データ明細フォームバリデーション
 */
class PlaceOrderDetailRequest extends BaseRequest
{
  public function rules()
  {
    return [
      'item_id' => 'required|integer|exists:items,id',
      'quantity' => 'required|integer|between:0,999',
    ];
  }

  public function attributes()
  {
    return [
      'item_id' => '品番',
      'quantity' => '数量',
    ];
  }
}
