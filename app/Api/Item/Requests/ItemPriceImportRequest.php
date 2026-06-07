<?php

namespace App\Api\Item\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 商品単価取込フォームバリデーション
 */
class ItemPriceImportRequest extends BaseRequest
{
  public function rules()
  {
    return [
      'file' => 'required|file|mimes:xlsx,xls',
    ];
  }

  public function attributes()
  {
    return [
      'file' => '取込ファイル',
    ];
  }
}
