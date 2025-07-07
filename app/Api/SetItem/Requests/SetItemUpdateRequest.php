<?php

namespace App\Api\SetItem\Requests;

use App\Base\Http\Requests\Api\BaseRequest;
use Illuminate\Validation\Rule;

/**
 * セット品マスタ更新フォームバリデーション
 */
class SetItemUpdateRequest extends BaseRequest
{
  use SetItemRequestTrait;

  public function rules()
  {
    return [
      'item_number' => [
        'required',
        'string',
        'max:50',
        Rule::unique('items', 'item_number')
          ->ignore($this->id, 'id'),
      ],
    ] + $this->commonRules();
  }
}
