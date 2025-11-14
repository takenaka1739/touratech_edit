<?php

namespace App\Api\Item\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\Item\Requests\CombStoreRequest;
use App\Api\Item\Requests\CombUpdateRequest;
use App\Api\Item\Services\CombService;
use Illuminate\Http\Request;

/**
 * 商品分類マスタ
 */
class CombController extends BaseController
{
  /** @var \App\Api\ItemClassification\Services\CombService */
  protected $service;

  /**
   * @param \App\Api\ItemClassification\Services\CombService $service
   */
  public function __construct(CombService $service)
  {
    $this->service = $service;
  }

  /**
   * 登録
   */
  public function store(CombStoreRequest $request)
  {
    $this->service->store($request->validated());
    return $this->success();
  }

  /**
   * 更新
   *
   * @param int $id 商品分類ID
   */
  public function update(CombUpdateRequest $request, int $id)
  {
    $this->service->update($id, $request->validated());
    return $this->success();
  }
}