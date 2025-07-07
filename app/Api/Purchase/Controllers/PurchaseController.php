<?php

namespace App\Api\Purchase\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\Purchase\Requests\PurchaseStoreRequest;
use App\Api\Purchase\Requests\PurchaseUpdateRequest;
use App\Api\Purchase\Requests\PurchaseDetailRequest;
use App\Api\Purchase\Services\PurchaseService;
use Illuminate\Http\Request;

/**
 * 仕入データコントローラー
 */
class PurchaseController extends BaseController
{
  /** @var \App\Api\Purchase\Services\PurchaseService */
  protected $service;

  /**
   * @param \App\Api\Purchase\Services\PurchaseService $service
   */
  public function __construct(PurchaseService $service)
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

  /**
   * 詳細画面
   *
   * @param mixed $id 仕入ID
   */
  public function edit($id = null)
  {
    if ($id) {
      $data = $this->service->get($id);
    } else {
      $data = $this->service->newData();
    }

    return $this->success($data);
  }

  /**
   * 登録
   */
  public function store(PurchaseStoreRequest $request)
  {
    $this->service->store($request->validated());

    return $this->success();
  }

  /**
   * 更新
   *
   * @param int $id 仕入ID
   */
  public function update(PurchaseUpdateRequest $request, int $id)
  {
    $this->service->update($id, $request->validated());

    return $this->success();
  }

  /**
   * 削除
   *
   * @param int $id 仕入ID
   */
  public function delete(int $id)
  {
    $this->service->delete($id);

    return $this->success();
  }

  /**
   * 明細（バリデーション）
   */
  public function detail(PurchaseDetailRequest $request)
  {
    return $this->success();
  }
}