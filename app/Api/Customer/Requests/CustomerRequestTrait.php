<?php

namespace App\Api\Customer\Requests;

use Illuminate\Validation\Rule;

/**
 * 得意先マスタ共通フォームバリデーション
 */
trait CustomerRequestTrait
{
  public function commonRules()
  {
    return [
      'name' => 'required|string|max:30',
      'kana' => 'required|string|max:30',
      'zip_code' => 'required|zip_code',
      'address1' => 'required|string|max:30',
      'address2' => 'nullable|string|max:30',
      'tel' => 'required|tel',
      'fax' => 'nullable|tel',
      'email' => 'bail|nullable|string|email:rfc|max:128',
      'fraction' => [
        'required',
        'integer',
        Rule::in([1, 2, 3]),
      ],
      'corporate_class' => [
        'required',
        'integer',
        Rule::in([1, 2, 3, 4, 5]),
      ],
      'bank_class' => [
        'required',
        'integer',
        Rule::in([1, 2]),
      ],
      'cutoff_date' => 'required|digits_between:1,31',
      'rate' => 'required|digits_between:1,100',
      'remarks' => 'nullable|string|max:200',
    ];
  }

  public function attributes()
  {
    return [
			'name' => '得意先名',
			'kana' => 'カナ',
			'zip_code' => '郵便番号',
			'address1' => '住所1',
			'address2' => '住所2',
			'tel' => 'TEL',
			'fax' => 'FAX',
			'email' => 'MAIL',
      'fraction' => '端数処理',
			'corporate_class' => '支払方法',
			'bank_class' => '口座選択',
			'cutoff_date' => '締日',
			'rate' => '掛率',
			'remarks' => '備考',
		];
  }
}