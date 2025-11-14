<?php

namespace App\Api\SetItem\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\SetItem\Requests\SetItemStoreRequest;
use App\Api\SetItem\Requests\SetItemUpdateRequest;
use App\Api\SetItem\Requests\SetItemDetailRequest;
use App\Api\SetItem\Services\SetItemService;
use Illuminate\Http\Request;

/**
 * セット品マスタコントローラー
 */
class SetItemController extends BaseController
{
  /** @var \App\Api\SetItem\Services\SetItemService */
  protected $service;

  /**
   * @param \App\Api\SetItem\Services\SetItemService $service
   */
  public function __construct(SetItemService $service)
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
   * @param int $id セット品ID
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
   * @param int $id セット品ID
   */
  public function edit(int $id)
  {
    $data = $this->service->get($id);

    return $this->success($data);
  }

  /**
   * 登録
   */
  public function store(SetItemStoreRequest $request)
  {
    $this->service->store($request->validated());

    return $this->success();
  }

  /**
   * 更新
   *
   * @param int $id セット品ID
   */
  public function update(SetItemUpdateRequest $request, int $id)
  {
    $this->service->update($id, $request->validated());

    return $this->success();
  }

  /**
   * 削除
   *
   * @param int $id セット品ID
   */
  public function delete(int $id)
  {
    $this->service->delete($id);

    return $this->success();
  }

  /**
   * 明細（バリデーション）
   */
  public function detail(SetItemDetailRequest $request)
  {
    return $this->success();
  }
}