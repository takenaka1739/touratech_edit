<?php

namespace App\Api\Invoice\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 請求データ月締フォームバリデーション
 */
class InvoiceClosingRequest extends BaseRequest
{
  public function rules()
  {
    return [
      'c_invoice_month' => 'required|month',
      'c_cutoff_date' => 'nullable|digits_between:1,31',
    ];
  }

  public function attributes()
  {
    return [
      'c_invoice_month' => '請求月',
      'c_cutoff_date' => '締日',
    ];
  }
}
