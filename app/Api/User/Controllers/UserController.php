<?php

namespace App\Api\User\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\User\Requests\UserStoreRequest;
use App\Api\User\Requests\UserUpdateRequest;
use App\Api\User\Services\UserService;
use Illuminate\Http\Request;

/**
 * 担当者マスタコントローラー
 */
class UserController extends BaseController
{
  /** @var \App\Api\User\Services\UserService */
  protected $service;

  /**
   * @param \App\Api\User\Services\UserService $service
   */
  public function __construct(UserService $service)
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
   * @param int $id 担当者ID
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
   * @param int $id 担当者ID
   */
  public function edit(Request $request, int $id)
  {
    $data = $this->service->get($id);

    return $this->success($data);
  }

  /**
   * 登録
   */
  public function store(UserStoreRequest $request)
  {
    $this->service->store($request->validated());

    return $this->success();
  }

  /**
   * 更新
   *
   * @param int $id 担当者ID
   */
  public function update(UserUpdateRequest $request, int $id)
  {
    $this->service->update($id, $request->validated());

    return $this->success();
  }

  /**
   * 削除
   *
   * @param int $id 担当者ID
   */
  public function delete(int $id)
  {
    if (!$this->service->canDeleted($id)) {
      return $this->error("", [
        'login_id' => '管理者のラスト1件は削除できません。',
      ]);
    }

    $this->service->delete($id);

    return $this->success();
  }
}