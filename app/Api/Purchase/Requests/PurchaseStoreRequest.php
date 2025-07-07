<?php

namespace App\Api\Purchase\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 仕入データ登録フォームバリデーション
 */
class PurchaseStoreRequest extends BaseRequest
{
  use PurchaseRequestTrait;

  public function rules()
  {
    return [
      'place_order_id' => 'nullable|integer|exists:place_orders,id',
      'details.*.place_order_detail_id' => 'nullable|integer|exists:place_order_details,id',
    ] + $this->commonRules();
  }
}
