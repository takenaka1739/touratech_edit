<?php

namespace App\Api\ItemClassification\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 商品分類マスタ登録フォームバリデーション
 */
class ItemClassificationStoreRequest extends BaseRequest
{
  use ItemClassificationRequestTrait;

  public function rules()
  {
    return $this->commonRules();
  }

}
