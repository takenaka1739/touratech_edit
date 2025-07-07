<?php

namespace App\Api\Item\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 商品マスタ登録フォームバリデーション
 */
class ItemStoreRequest extends BaseRequest
{
  use ItemRequestTrait;

  public function rules()
  {
    return $this->commonRules();
  }
}
