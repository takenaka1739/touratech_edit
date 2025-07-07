<?php

namespace App\Api\Customer\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\Customer\Requests\CustomerStoreRequest;
use App\Api\Customer\Requests\CustomerUpdateRequest;
use App\Api\Customer\Requests\CustomerSimpleStoreRequest;
use App\Api\Customer\Services\CustomerService;
use App\Api\Customer\Services\CustomerExcelService;
use Illuminate\Http\Request;

/**
 * 得意先マスタコントローラー
 */
class CustomerController extends BaseController
{
  /** @var \App\Api\Customer\Services\CustomerService */
  protected $service;

  /**
   * @param \App\Api\Customer\Services\CustomerService $service
   */
  public function __construct(CustomerService $service)
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
   * @param int $id 得意先ID
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
   * @param int $id 得意先ID
   */
  public function edit(int $id)
  {
    $data = $this->service->get($id);

    return $this->success($data);
  }

  /**
   * 登録
   */
  public function store(CustomerStoreRequest $request)
  {
    $this->service->store($request->validated());

    return $this->success();
  }

  /**
   * 更新
   *
   * @param int $id 得意先ID
   */
  public function update(CustomerUpdateRequest $request, int $id)
  {
    $this->service->update($id, $request->validated());

    return $this->success();
  }

  /**
   * 削除
   *
   * @param int $id 得意先ID
   */
  public function delete(int $id)
  {
    $this->service->delete($id);

    return $this->success();
  }

  /**
   * 簡易登録
   */
  public function simple_store(CustomerSimpleStoreRequest $request)
  {
    $id = $this->service->simpleStore($request->validated());

    return $this->success([
      'id' => $id,
    ]);
  }

  /**
   * エクセル出力
   */
  public function output_excel(Request $request)
  {
    $input = $request->all();
    $rows = $this->service->getExcelData($input);

    $excel = new CustomerExcelService();
    $file_id = $excel->createExcel($rows);
    return $this->success([
      'file_id' => $file_id,
    ]);
  }
}