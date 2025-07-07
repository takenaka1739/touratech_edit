<?php

namespace App\Api\ItemClassification\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\ItemClassification\Requests\ItemClassificationStoreRequest;
use App\Api\ItemClassification\Requests\ItemClassificationUpdateRequest;
use App\Api\ItemClassification\Services\ItemClassificationService;
use Illuminate\Http\Request;

/**
 * 商品分類マスタ
 */
class ItemClassificationController extends BaseController
{
  /** @var \App\Api\ItemClassification\Services\ItemClassificationService */
  protected $service;

  /**
   * @param \App\Api\ItemClassification\Services\ItemClassificationService $service
   */
  public function __construct(ItemClassificationService $service)
  {
    $this->service = $service;
  }

  /**
   * 検索画面
   */
  public function dialog(Request $request)
  {
    $input = $request->all();
    $data = $this->service->dialog($input);

    return $this->success($data);
  }

  /**
   * 選択
   *
   * @param int $id 商品分類ID
   */
  public function selected(int $id)
  {
    $data = $this->service->get($id);

    return $this->success($data);
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

  /**
   * 詳細画面
   *
   * @param int $id 商品分類ID
   */
  public function edit(int $id)
  {
    $data = $this->service->get($id);

    return $this->success($data);
  }

  /**
   * 登録
   */
  public function store(ItemClassificationStoreRequest $request)
  {
    $this->service->store($request->validated());

    return $this->success();
  }

  /**
   * 更新
   *
   * @param int $id 商品分類ID
   */
  public function update(ItemClassificationUpdateRequest $request, int $id)
  {
    $this->service->update($id, $request->validated());

    return $this->success();
  }

  /**
   * 削除
   *
   * @param int $id 商品分類ID
   */
  public function delete(int $id)
  {
    $this->service->delete($id);

    return $this->success();
  }
}