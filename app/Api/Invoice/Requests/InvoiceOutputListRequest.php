<?php

namespace App\Api\Invoice\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 請求データ請求一覧バリデーション
 */
class InvoiceOutputListRequest extends BaseRequest
{
  public function rules()
  {
    return [
      'c_invoice_month' => 'required|month',
      'selected' => 'required',
    ];
  }

  public function attributes()
  {
    return [
      'c_invoice_month' => '請求月',
      'selected' => '選択',
    ];
  }
}
