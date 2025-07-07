<?php

namespace App\Api\Purchase\Requests;

use Illuminate\Validation\Rule;

/**
 * 仕入データ共通フォームバリデーション
 */
trait PurchaseRequestTrait
{
  public function commonRules()
  {
    return [
      'purchase_date' => 'required|date',
      'user_id' => 'required|integer|exists:users,id',
      'total_amount' => 'required|numeric',
      'remarks' => 'nullable|string|max:200',
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
      'purchase_date' => '仕入日',
      'user_id' => '担当者',
      'total_amount' => '合計金額',
      'remarks' => '備考',
      'details' => '明細',
    ];
  }
}