<?php

namespace App\Api\Estimate\Requests;

use Illuminate\Validation\Rule;

/**
 * 見積データ共通フォームバリデーション
 */
trait EstimateRequestTrait
{
  public function commonRules()
  {
    return [
      'estimate_date' => 'required|date',
      'delivery_date' => 'nullable|date',
      'customer_id' => 'nullable|integer|exists:customers,id',
      'customer_name' => 'required|string|max:30',
      'send_flg' => 'required|boolean',
      'name' => 'required_if:send_flg,true|nullable|string|max:30',
      'zip_code' => 'required_if:send_flg,true|nullable|zip_code',
      'address1' => 'required_if:send_flg,true|nullable|string|max:30',
      'address2' => 'nullable|string|max:30',
      'tel' => 'required|tel',
      'fax' => 'nullable|tel',
      'corporate_class' => [
        'required',
        'integer',
        Rule::in([1, 2, 3, 4, 5]),
      ],
      'user_id' => 'nullable|integer|exists:users,id',
      'order_no' => 'nullable|string|max:20',
      'shipping_amount' => 'nullable|numeric|price',
      'fee' => 'nullable|numeric|price',
      'discount' => 'nullable|numeric|price',
      'total_amount' => 'required|numeric',
      'remarks' => 'nullable|string|max:200',
      'rate' => 'nullable|integer|between:1,100',
      'fraction' => [
        'nullable',
        'integer',
        Rule::in(1, 2, 3),
      ],
      'details' => 'required',
      'details.*.no' => 'required|integer',
      'details.*.item_kind' => [
        'required',
        'integer',
        Rule::in(1, 2),
      ],
      'details.*.item_id' => 'required|integer|exists:items,id',
      'details.*.item_number' => 'nullable|string|max:50',
      'details.*.item_name' => 'nullable|string|max:400',
      'details.*.item_name_jp' => 'nullable|string|max:400',
      'details.*.sales_unit_price' => 'nullable|numeric|price',
      'details.*.fraction' => [
        'nullable',
        'integer',
        Rule::in(1, 2, 3),
      ],
      'details.*.rate' => 'nullable|integer|between:1,100',
      'details.*.unit_price' => 'required|numeric|price',
      'details.*.quantity' => 'required|integer|between:0,999',
      'details.*.amount' => 'nullable|numeric',
      'details.*.sales_tax' => 'nullable|numeric',
    ];
  }

	public function attributes()
	{
		return [
			'estimate_date' => '見積日',
      'delivery_date' => '納入期日',
			'customer_id' => '得意先',
      'send_flg' => '発送',
      'name' => '届け先名',
      'zip_code' => '郵便番号',
      'address1' => '住所1',
      'address2' => '住所2',
			'tel' => 'TEL',
      'fax' => 'FAX',
      'corporate_class' => '支払方法',
			'user_id' => '担当者',
      'order_no' => '注文番号',
      'shipping_amount' => '送料',
      'fee' => '代引手数料',
      'discount' => '値引',
			'total_amount' => '合計金額',
			'remarks' => '備考',
			'details' => '明細',
		];
	}

  public function messages()
  {
    return [
      'name.required_if' => ':otherを指定した場合、:attributeは必ず指定してください。',
      'zip_code.required_if' => ':otherを指定した場合、:attributeは必ず指定してください。',
      'address1.required_if' => ':otherを指定した場合、:attributeは必ず指定してください。',
    ];
  }
}