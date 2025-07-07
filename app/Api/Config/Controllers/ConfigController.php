<?php

namespace App\Api\Config\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\Config\Services\ConfigService;
use App\Api\Config\Requests\ConfigUpdateRequest;
use Illuminate\Support\Facades\Log;

/**
 * 環境設定コントローラー
 */
class ConfigController extends BaseController
{
  protected $service;

  /**
   * コンストラクタ
   */
  public function __construct(ConfigService $service)
  {
    $this->service = $service;
  }

  /**
   * 詳細画面
   */
  public function index()
  {
    $data = $this->service->get();
    return $this->success($data);
  }

  /**
   * 更新
   */
  public function update(ConfigUpdateRequest $request)
  {
    $this->service->update($request->validated());

    return $this->success();
  }
}
