<?php

namespace App\Api\Supplier\Requests;

use Illuminate\Validation\Rule;

/**
 * 仕入先マスタ共通フォームバリデーション
 */
trait SupplierRequestTrait
{
  public function commonRules()
  {
    return [
      'name' => 'required|string|max:30',
      'zip_code' => 'required|zip_code',
      'address1' => 'required|string|max:30',
      'address2' => 'nullable|string|max:30',
      'tel' => 'required|tel',
      'fax' => 'nullable|tel',
      'email' => 'bail|nullable|string|email:rfc|max:128',
      'foreign_currency_type' => 'required|integer|min:1',
      'fraction' => [
        'required',
        'integer',
        Rule::in([1, 2, 3]),
      ],
      'output_no' => [
        'required',
        'string',
        'max:10',
        Rule::unique('suppliers', 'output_no')
          ->ignore($this->id, 'id'),
      ],
      'remarks' => 'nullable|string|max:200',
    ];
  }

  public function attributes()
  {
    return [
      'name' => '仕入先名',
      'zip_code' => '郵便番号',
      'address1' => '住所1',
      'address2' => '住所2',
      'tel' => 'TEL',
      'fax' => 'FAX',
      'email' => 'MAIL',
      'foreign_currency_type' => '外貨種類',
      'fraction' => '端数処理',
      'output_no' => 'CSV出力番号',
      'remarks' => '備考',
    ];
  }

  public function messages()
  {
    return [
      'foreign_currency_type.min' => '外貨種類は必ず指定してください。',
    ];
  }
}