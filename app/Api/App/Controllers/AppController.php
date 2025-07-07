<?php

namespace App\Api\App\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\App\Services\AppService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/**
 * アプリケーション共通コントローラー
 */
class AppController extends BaseController
{
  /** @var \App\Api\App\Services\AppService */
  protected $service;

  /**
   * @param \App\Api\App\Services\AppService $service
   */
  public function __construct(AppService $service)
  {
    $this->service = $service;
  }

  /**
   * 初期化処理
   */
  public function index()
  {
    $user = Auth::user();
    $config = $this->service->getConfig();
    $config['currencies'] = $this->service->getConfigCurrency();
    $config['cods'] = $this->service->getConfigCod();
    $init_customer = config('const.init_customer');

    return $this->success([
      'auth' => [
        'name' => $user->name,
        'role' => $user->role,
      ],
      'config' => $config,
      'initCustomer' => $init_customer,
    ]);
  }
}