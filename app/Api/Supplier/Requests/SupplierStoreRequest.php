<?php

namespace App\Api\Supplier\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 仕入先マスタ登録フォームバリデーション
 */
class SupplierStoreRequest extends BaseRequest
{
  use SupplierRequestTrait;

  public function rules()
  {
    return $this->commonRules();
  }
}
