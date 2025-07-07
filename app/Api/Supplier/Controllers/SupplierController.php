<?php

namespace App\Api\Supplier\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\Supplier\Requests\SupplierStoreRequest;
use App\Api\Supplier\Requests\SupplierUpdateRequest;
use App\Api\Supplier\Services\SupplierService;
use Illuminate\Http\Request;

/**
 * 仕入先マスタコントローラー
 */
class SupplierController extends BaseController
{
  /** @var \App\Api\Supplier\Services\SupplierService */
  protected $service;

  /**
   * @param \App\Api\Supplier\Services\SupplierService $service
   */
  public function __construct(SupplierService $service)
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
   * @param int $id 仕入先ID
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
   * @param int $id 仕入先ID
   */
  public function edit(int $id)
  {
    $data = $this->service->get($id);

    return $this->success($data);
  }

  /**
   * 登録
   */
  public function store(SupplierStoreRequest $request)
  {
    $this->service->store($request->validated());

    return $this->success();
  }

  /**
   * 更新
   *
   * @param int $id 仕入先ID
   */
  public function update(SupplierUpdateRequest $request, int $id)
  {
    $this->service->update($id, $request->validated());

    return $this->success();
  }

  /**
   * 削除
   *
   * @param int $id 仕入先ID
   */
  public function delete(int $id)
  {
    $this->service->delete($id);

    return $this->success();
  }
}