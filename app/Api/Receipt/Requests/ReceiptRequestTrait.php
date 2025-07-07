<?php

namespace App\Api\Receipt\Requests;

/**
 * 入金データ共通フォームバリデーション
 */
trait ReceiptRequestTrait
{
  public function commonRules()
  {
    return [
      'receipt_date' => 'required|date',
      'customer_id' => 'nullable|integer|exists:customers,id',
      'customer_name' => 'required|string|max:30',
      'user_id' => 'required|integer|exists:users,id',
      'total_amount' => 'required|numeric',
      'remarks' => 'nullable|string|max:200',
    ];
  }

  public function attributes()
  {
    return [
      'receipt_date' => '入金日',
      'customer_id' => '得意先',
      'user_id' => '担当者',
      'total_amount' => '入金額',
      'remarks' => '備考',
    ];
  }
}