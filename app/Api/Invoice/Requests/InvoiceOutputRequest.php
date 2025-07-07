<?php

namespace App\Api\Invoice\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 請求データ請求書バリデーション
 */
class InvoiceOutputRequest extends BaseRequest
{
  public function rules()
  {
    return [
      'selected' => 'required',
    ];
  }

  public function attributes()
  {
    return [
      'selected' => '選択',
    ];
  }
}
