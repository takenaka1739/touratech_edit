<?php

namespace App\Api\ReceiveOrderStatus\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\ReceiveOrderStatus\Services\ReceiveOrderStatusService;
use Illuminate\Http\Request;

/**
 * 受注状況一覧コントローラー
 */
class ReceiveOrderStatusController extends BaseController
{
  /** @var \App\Api\ReceiveOrderStatus\Services\ReceiveOrderStatusService */
  protected $service;

  /**
   * @param \App\Api\ReceiveOrderStatus\Services\ReceiveOrderStatusService $service
   */
  public function __construct(ReceiveOrderStatusService $service)
  {
    $this->service = $service;
  }

  /**
   * 一覧画面
   */
  public function fetch(Request $request)
  {
    $input = $request->all();
    $data = $this->service->fetch($input);

    return $this->success($data);
  }
}