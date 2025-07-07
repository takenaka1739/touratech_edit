<?php

namespace App\Api\Purchase\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 仕入データ明細フォームバリデーション
 */
class PurchaseDetailRequest extends BaseRequest
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
