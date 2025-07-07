<?php

namespace App\Api\Item\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 商品マスタ取得フォームバリデーション
 */
class ItemGetDetailRequest extends BaseRequest
{
  public function rules()
  {
    return [
      'barcode' => [
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
      'barcode' => 'バーコード',
    ];
  }
}
