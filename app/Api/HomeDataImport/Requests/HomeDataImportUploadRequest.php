<?php

namespace App\Api\HomeDataImport\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 本国商品データ取込フォームバリデーション
 */
class HomeDataImportUploadRequest extends BaseRequest
{
  public function rules()
  {
    return [
      'file' => 'required|file|mimes:xls',

    ];
  }

  public function attributes()
  {
    return [
      'file' => '取込ファイル',
    ];
  }
}
