<?php

namespace App\Api\InventoryImport\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 棚卸処理フォーム在庫確定バリデーション
 */
class InventoryImportConfirmRequest extends BaseRequest
{
  public function rules()
  {
    // $today = date('Y-m-d');
    return [
      'c_inventory_month' => "required|month",
    ];
  }

  public function attributes()
  {
    return [
      'c_inventory_month' => '棚卸年月',
    ];
  }
}
