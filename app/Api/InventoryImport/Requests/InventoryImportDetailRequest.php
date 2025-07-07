<?php

namespace App\Api\InventoryImport\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 棚卸処理フォーム明細バリデーション
 */
class InventoryImportDetailRequest extends BaseRequest
{
  public function rules()
  {
    return [
      'import_month' => "required|month",
      'item_number' => 'required|string|max:50',
      'quantity' => 'required|integer|between:0,9999',
      'unmatch' => 'required|integer',
    ];
  }

  public function attributes()
  {
    return [
      'import_month' => '棚卸年月',
      'item_number' => '品番',
      'quantity' => '取込数',
      'unmatch' => '不一致',
    ];
  }
}
