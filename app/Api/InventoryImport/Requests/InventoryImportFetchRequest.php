<?php

namespace App\Api\InventoryImport\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 棚卸処理フォーム読込バリデーション
 */
class InventoryImportFetchRequest extends BaseRequest
{
  public function rules()
  {
    return [
      'c_inventory_month' => "required|month",
      'c_unmatch' => 'nullable|integer',
    ];
  }

  public function attributes()
  {
    return [
      'c_inventory_month' => '棚卸年月',
      'c_unmatch' => '出力対象',
    ];
  }
}
