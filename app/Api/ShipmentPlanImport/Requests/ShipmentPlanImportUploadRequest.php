<?php

namespace App\Api\ShipmentPlanImport\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 発送予定取込フォームバリデーション
 */
class ShipmentPlanImportUploadRequest extends BaseRequest
{
  public function rules()
  {
    return [
      'file' => 'required|file',
      'c_arrival_date' => "required|date",
    ];
  }

  public function attributes()
  {
    return [
      'file' => '取込ファイル',
      'c_arrival_date' => '到着予定日',
    ];
  }
}
