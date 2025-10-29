<?php

namespace App\Api\Item\Requests;

use App\Base\Http\Requests\Api\BaseRequest;
use Illuminate\Validation\Rule;

/**
 * 商品マスタ更新フォームバリデーション
 */
class ItemUpdateRequest extends BaseRequest
{
  use ItemRequestTrait;

  public function rules()
  {
    \log::debug('ItemUpdateRequest.rules');

    return [
      'item_number' => [
        'required',
        'string',
        'max:50',
        Rule::unique('m_items', 'item_number')
          ->ignore($this->id, 'id'),
      ],
    ] + $this->commonRules();
  }
}
