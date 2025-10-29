<?php

namespace App\Api\Estimate\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 見積データ明細フォームバリデーション
 */
class EstimateDetailRequest extends BaseRequest
{
  public function rules()
  {
    return [
      'item_id' => 'required|integer|exists:m_items,id',
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