<?php

namespace App\Api\SetItem\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * セット品マスタ明細フォームバリデーション
 */
class SetItemDetailRequest extends BaseRequest
{
  public function rules()
  {
    return [
      'item_id' => 'required|integer|exists:items,id',
      'quantity' => 'required|integer|between:0,999',
      'set_price' => 'required|numeric|price',
    ];
  }

  public function attributes()
  {
    return [
      'item_id' => '品番',
      'quantity' => '数量',
      'set_price' => '売上単価（セット時）',
    ];
  }
}
