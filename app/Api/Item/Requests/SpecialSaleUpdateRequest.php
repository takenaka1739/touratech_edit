<?php

namespace App\Api\Item\Requests;

use App\Base\Http\Requests\Api\BaseRequest;
use Illuminate\Validation\Rule;

/**
 * 商品マスタ更新フォームバリデーション
 */
class SpecialSaleUpdateRequest extends BaseRequest
{
  use SpecialSaleRequestTrait;

  public function rules()
  {
    \log::debug('SpecialSaleUpdateRequest.rules');
    \log::debug($this->commonRules());

    return $this->commonRules();
  }
}
