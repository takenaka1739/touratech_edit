<?php

namespace App\Api\InventoryImport\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 棚卸処理フォーム取込バリデーション
 */
class InventoryImportUploadRequest extends BaseRequest
{
  public function rules()
  {
    return [
      'file' => 'required|file|mimes:xlsx',
      'c_inventory_month' => "required|month",
      'c_unmatch' => 'nullable|integer',
    ];
  }

  public function attributes()
  {
    return [
      'file' => '取込ファイル',
      'c_inventory_month' => '棚卸年月',
      'c_unmatch' => '出力対象',
    ];
  }
}
