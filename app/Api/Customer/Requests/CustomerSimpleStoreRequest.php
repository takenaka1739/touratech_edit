<?php

namespace App\Api\Customer\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 得意先マスタ簡易登録
 */
class CustomerSimpleStoreRequest extends BaseRequest
{
  public function rules()
  {
    return [
      'name' => 'required|string|max:30|unique:customers',
      'kana' => 'nullable|string|max:30',
      'zip_code' => 'required|zip_code',
      'address1' => 'required|string|max:30',
      'address2' => 'nullable|string|max:30',
      'tel' => 'required|tel|unique:customers',
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
		];
  }
}
