<?php

namespace App\Api\PlaceOrderExport\Requests;

use App\Base\Http\Requests\Api\BaseRequest;
use App\Base\Rules\FileName;

/**
 * 発注確定フォームバリデーション
 */
class PlaceOrderExportOutputRequest extends BaseRequest
{
  public function rules()
  {
    return [
      'c_place_order_date_from' => 'required|date',
      'c_place_order_date_to' => 'required|date|after_or_equal:c_place_order_date_from',
      'c_is_output' => 'required|boolean',
    ];
  }

  public function attributes()
  {
    return [
      'c_place_order_date_from' => '発注日From',
      'c_place_order_date_to' => '発注日To',
      'c_is_output' => '出力済みも含む',
    ];
  }
}
