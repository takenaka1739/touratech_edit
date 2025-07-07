<?php

namespace App\Api\InventoryPrinting\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 在庫表印刷フォームバリデーション
 */
class InventoryPrintingOutputRequest extends BaseRequest
{
  public function rules()
  {
    return [
      'import_month' => 'required|month',
    ];
  }

  public function attributes()
  {
    return [
      'import_month' => '対象年月',
    ];
  }
}
