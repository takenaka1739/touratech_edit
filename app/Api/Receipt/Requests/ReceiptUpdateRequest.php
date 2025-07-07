<?php

namespace App\Api\Receipt\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 入金データ更新フォームバリデーション
 */
class ReceiptUpdateRequest extends BaseRequest
{
  use ReceiptRequestTrait;

  public function rules()
  {
    return [
    ] + $this->commonRules();
  }
}
