<?php

namespace App\Api\Config\Requests;

use App\Base\Http\Requests\Api\BaseRequest;
use Illuminate\Validation\Rule;

/**
 * 環境設定更新フォームバリデーション
 */
class ConfigUpdateRequest extends BaseRequest
{
  public function rules()
  {
    return [
      'company_name' => 'required|string|max:30',
      'zip_code' => 'required|zip_code',
      'address1' => 'required|string|max:30',
      'address2' => 'nullable|string|max:30',
      'tel' => 'required|tel',
      'fax' => 'nullable|tel',
      'email' => 'bail|nullable|string|email:rfc|max:128',
      'company_level' => [
        'required',
        Rule::in(['A', 'B', 'C', 'D', 'E'])
      ],
      'bank_name1' => 'required|string|max:30',
      'branch_name1' => 'required|string|max:30',
      'account_name1' => 'required|string|max:30',
      'account_type1' => 'required|string|max:30',
      'account_number1' => 'required|string|digits_between:4,7',
      'bank_name2' => 'required|string|max:30',
      'branch_name2' => 'required|string|max:30',
      'account_name2' => 'required|string|max:30',
      'account_type2' => 'required|string|max:30',
      'account_number2' => 'required|string|digits_between:4,7',
      'sales_tax_rate' => 'required|integer|between:1,100',
      'pre_tax_rate' => 'required|integer|between:1,100',
      'tax_rate_change_date' => 'required|date',
      'currencies.*.id' => 'required|integer',
      'currencies.*.rate' => 'bail|required|numeric|between:0,1000|currency',
      'cods.*.id' => 'required|integer',
      'cods.*.amount' => 'bail|required|numeric|price'
    ];
  }

  public function attributes()
  {
    return [
      'company_name' => '自社名',
      'zip_code' => '郵便番号',
      'address1' => '住所1',
      'address2' => '住所2',
      'tel' => 'TEL',
      'fax' => 'FAX',
      'email' => 'MAIL',
      'company_level' => '会社レベル',
      'bank_name1' => '銀行名①',
      'branch_name1' => '支店名①',
      'account_name1' => '口座名①',
      'account_type1' => '口座種別①',
      'account_number1' => '口座番号①',
      'bank_name2' => '銀行名②',
      'branch_name2' => '支店名②',
      'account_name2' => '口座名②',
      'account_type2' => '口座種別②',
      'account_number2' => '口座番号②',
      'sales_tax_rate' => '消費税率',
      'pre_tax_rate' => '変更前税率',
      'tax_rate_change_date' => '税率変更日',
      'currencies.*.id' => '掛率',
      'currencies.*.rate' => '掛率',
      'cods.*.id' => '代引手数料',
      'cods.*.amount' => '代引手数料',
    ];
  }
}
