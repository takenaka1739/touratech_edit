<?php

namespace App\Api\Item\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 商品マスタラベル発行フォームバリデーション
 */
class ItemOutputRequest extends BaseRequest
{
  public function rules()
  {
    return [
      'item_number' => [
        'required',
        'string',
        'max:50',
      ],
      'name_label' => 'required|string|max:36',
      'sales_unit_price' => 'required|numeric|price',
      'selected' => 'required|array',
      'isPrintPrice' => 'nullable|boolean',
    ];
  }

  public function attributes()
  {
    return [
      'item_number' => '品番',
      'name_jp' => '商品名（ラベル用）',
      'sales_unit_price' => '売上単価',
      'selected' => 'ラベル位置',
    ];
  }
}
