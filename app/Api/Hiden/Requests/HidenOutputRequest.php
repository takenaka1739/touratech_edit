<?php

namespace App\Api\Hiden\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 売上飛伝出力フォームバリデーション
 */
class HidenOutputRequest extends BaseRequest
{
  public function rules()
  {
    return [
      'c_sales_date_from' => 'required|date',
      'c_sales_date_to' => 'required|date|after_or_equal:c_sales_date_from',
    ];
  }

  public function attributes()
  {
    return [
      'c_sales_date_from' => '売上日From',
      'c_sales_date_to' => '売上日To',
    ];
  }
}
