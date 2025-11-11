<?php

namespace App\Api\Item\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 商品分類マスタ登録フォームバリデーション
 */
class ImageStoreRequest extends BaseRequest
{
  use ImageRequestTrait;

  public function rules(): array
  {
    \Log::debug('デバッグ：ImageStoreRequest');

    return $this->commonRules();
  }

}
