<?php

namespace App\Api\Sales\Requests;
use Illuminate\Validation\Rule;

/**
 * 売上データ共通フォームバリデーション
 */
trait SalesRequestTrait
{
  public function commonRules()
  {
    return [
      'sales_at' => 'required|date',
      'delivery_date' => 'nullable|date',
      'customer_id' => 'required|integer|exists:t_customers,id',
      'send_flg' => 'required|boolean',
      'personnel_id' => 'nullable|integer|exists:m_personnels,id',
      'order_no' => 'nullable|string|max:20',
      'shipping_amount' => 'nullable|numeric|price',
      'fee' => 'nullable|numeric|price',
      'discount' => 'nullable|numeric|price',
      'total_amount' => 'required|numeric',
      'remarks' => 'nullable|string|max:200',
      'details' => 'required|array',
      'details.*.no' => 'required|integer',
      'details.*.item_kind' => [
        'required',
        'integer',
        Rule::in([1, 2]),
      ],
      'details.*.item_id' => 'required|integer|exists:m_items,id',
      'details.*.sales_unit_price' => 'nullable|numeric|price',
      'details.*.unit_price' => 'required|numeric|price',
      'details.*.quantity' => 'required|integer|between:0,999',
      'details.*.amount' => 'nullable|numeric',
      'details.*.sales_tax' => 'nullable|numeric',
    ];
  }

	public function attributes()
  {
    return [
      'sales_at' => '売上日',
      'delivery_date' => '納入期日',
      'customer_id' => 'required|integer|exists:t_customers,id',
      'send_flg' => '発送',
      'personnel_id' => 'nullable|integer|exists:m_personnels,id',
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