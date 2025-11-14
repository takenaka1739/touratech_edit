<?php

namespace App\Api\Item\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\Item\Services\SpecialSaleService;
use App\Api\Item\Requests\SpecialSaleStoreRequest;
use App\Api\Item\Requests\SpecialSaleUpdateRequest;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

/**
 * 商品マスタコントローラー
 */
class SpecialSaleController extends BaseController
{
  /** @var \App\Api\Item\Services\SpecialSaleService */
  protected $service;

  /**
   * @param \App\Api\Item\Services\SpecialSaleService $service
   */
  public function __construct(SpecialSaleService $service)
  {
    $this->service = $service;
  }

    /**
   * 登録
   */
  public function store(SpecialSaleStoreRequest $request)
  {
    $this->service->store($request->validated());

    return $this->success();
  }

  /**
   * 更新
   *
   * @param int $id 商品ID
   */
  public function update(SpecialSaleUpdateRequest $request, int $id)
  {
    $this->service->update($id, $request->validated());

    return $this->success();
  }

//  /**
//   * 削除
//   *
//   * @param int $id 商品分類ID
//   */
  public function delete($id)
  {
    $this->service->delete($id);

    return $this->success();
  }
}