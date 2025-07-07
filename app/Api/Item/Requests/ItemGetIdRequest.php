<?php

namespace App\Api\Item\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 商品マスタID取得フォームバリデーション
 */
class ItemGetIdRequest extends BaseRequest
{
  public function rules()
  {
    return [
      'c_item_number' => [
        'required',
        'string',
        'max:50',
        'exists:items,item_number',
      ],
    ];
  }

  public function attributes()
  {
    return [
      'c_item_number' => '品番',
    ];
  }
}
