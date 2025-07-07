<?php

namespace App\Api\Receipt\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 入金データ登録フォームバリデーション
 */
class ReceiptStoreRequest extends BaseRequest
{
  use ReceiptRequestTrait;

  public function rules()
  {
    return $this->commonRules();
  }
}
