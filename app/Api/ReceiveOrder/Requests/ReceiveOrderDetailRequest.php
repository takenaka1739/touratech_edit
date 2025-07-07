<?php

namespace App\Api\ReceiveOrder\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 受注データ明細フォームバリデーション
 */
class ReceiveOrderDetailRequest extends BaseRequest
{
  public function rules()
  {
    return [
      'item_id' => 'required|integer|exists:items,id',
      'unit_price' => 'required|numeric|price',
      'quantity' => 'required|integer|between:0,999',
    ];
  }

  public function attributes()
  {
    return [
      'item_id' => '品番',
      'unit_price' => '単価',
      'quantity' => '数量',
    ];
  }
}
