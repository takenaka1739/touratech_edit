<?php

namespace App\Api\Receipt\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\Receipt\Requests\ReceiptStoreRequest;
use App\Api\Receipt\Requests\ReceiptUpdateRequest;
use App\Api\Receipt\Services\ReceiptService;
use Illuminate\Http\Request;

/**
 * 入金データコントローラー
 */
class ReceiptController extends BaseController
{
  /** @var \App\Api\Receipt\Services\ReceiptService */
  protected $service;

  /**
   * @param \App\Api\Receipt\Services\ReceiptService $service
   */
  public function __construct(ReceiptService $service)
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
   * @param int $id 入金ID
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
  public function store(ReceiptStoreRequest $request)
  {
    $this->service->store($request->validated());

    return $this->success();
  }

  /**
   * 更新
   *
   * @param int $id 入金ID
   */
  public function update(ReceiptUpdateRequest $request, int $id)
  {
    if ($this->service->hasInvoice($id)) {
      return $this->error("", [
        'has_invoice' => '既に請求データが存在するため、データの編集は出来ません。',
      ]);
    }

    $this->service->update($id, $request->validated());

    return $this->success();
  }

  /**
   * 削除
   *
   * @param int $id 入金ID
   */
  public function delete(int $id)
  {
    if ($this->service->hasInvoice($id)) {
      return $this->error("", [
        'has_invoice' => '既に請求データが存在するため、データの編集は出来ません。',
      ]);
    }

    $this->service->delete($id);

    return $this->success();
  }

  /**
   * 得意先選択
   *
   * @param int $id 得意先ID
   */
  public function customer_selected(int $id)
  {
    $data = $this->service->getCustomer($id);

    return $this->success($data);
  }
}