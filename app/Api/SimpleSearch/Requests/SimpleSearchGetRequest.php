<?php

namespace App\Api\SimpleSearch\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 *
 */
class SimpleSearchGetRequest extends BaseRequest
{
  public function rules()
  {
    return [
      'c_item_number' => [
        'required',
        'string',
        'max:50',
      ],
    ];
  }

  public function attributes()
  {
    return [
      'c_item_number' => '品番',
    ];
  }
}