<?php

namespace App\Api\Item\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 商品分類マスタ更新フォームバリデーション
 */
class CombUpdateRequest extends BaseRequest
{
  use CombRequestTrait;

  public function rules()
  {
    \Log::debug('デバッグ：ImageUpdateRequest');

    return $this->commonRules();
  }
}
