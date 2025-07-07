<?php

namespace App\Api\PlaceOrder\Requests;

use Illuminate\Validation\Rule;

/**
 * 発注データ共通フォームバリデーション
 */
trait PlaceOrderRequestTrait
{
  public function commonRules()
  {
    return [
      'place_order_date' => 'required|date',
      'user_id' => 'nullable|integer|exists:users,id',
      'delivery_day' => 'nullable|string',
      'total_amount' => 'required|numeric',
      'remarks' => 'nullable|string|max:200',
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
      'details.*.unit_price' => 'required|numeric|price',
      'details.*.quantity' => 'required|integer|between:0,999',
      'details.*.amount' => 'nullable|numeric',
      'details.*.sales_tax' => 'nullable|numeric',
    ];
  }

  public function attributes()
  {
    return [
      'place_order_date' => '発注日',
      'user_id' => '担当者',
      'delivery_day' => '納期日数',
      'total_amount' => '合計金額',
      'remarks' => '備考',
      'details' => '明細',
    ];
  }
}