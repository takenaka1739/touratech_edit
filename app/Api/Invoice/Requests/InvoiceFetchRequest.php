<?php

namespace App\Api\Invoice\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 請求データ読み込みフォームバリデーション
 */
class InvoiceFetchRequest extends BaseRequest
{
  public function rules()
  {
    return [
      'c_invoice_month' => 'required|month',
    ];
  }

  public function attributes()
  {
    return [
      'c_invoice_month' => '請求月',
    ];
  }
}
