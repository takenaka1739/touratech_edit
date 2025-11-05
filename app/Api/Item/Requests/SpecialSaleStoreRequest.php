<?php

namespace App\Api\Item\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 商品マスタ登録フォームバリデーション
 */
class SpecialSaleStoreRequest extends BaseRequest
{
  use SpecialSaleRequestTrait;

  public function rules()
  {
    return $this->commonRules();
  }
}
