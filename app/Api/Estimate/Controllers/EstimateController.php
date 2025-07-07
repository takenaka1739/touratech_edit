<?php

namespace App\Api\Estimate\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\Estimate\Requests\EstimateStoreRequest;
use App\Api\Estimate\Requests\EstimateUpdateRequest;
use App\Api\Estimate\Requests\EstimateDetailRequest;
use App\Api\Estimate\Services\EstimateService;
use App\Api\Estimate\Services\EstimatePdfService;
use Illuminate\Http\Request;

/**
 * 見積データコントローラー
 */
class EstimateController extends BaseController
{
  /** @var \App\Api\Estimate\Services\EstimateService */
  protected $service;

  /**
   * @param \App\Api\Estimate\Services\EstimateService $service
   */
  public function __construct(EstimateService $service)
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
   * @param int $id 見積ID
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
   * @param int $id 見積ID
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
  public function store(EstimateStoreRequest $request)
  {
    $id = $this->service->store($request->validated());

    return $this->success([
      'id' => $id,
    ]);
  }

  /**
   * 更新
   *
   * @param int $id 見積ID
   */
  public function update(EstimateUpdateRequest $request, int $id)
  {
    if ($this->service->hasReceiveOrder($id)) {
      return $this->error("", [
        'has_receive_order' => '既に受注データが存在するため、データの編集は出来ません。',
      ]);
    }

    $this->service->update($id, $request->validated());

    return $this->success();
  }

  /**
   * 削除
   *
   * @param int $id 見積ID
   */
  public function delete(int $id)
  {
    if ($this->service->hasReceiveOrder($id)) {
      return $this->error("", [
        'has_receive_order' => '既に受注データが存在するため、データの編集は出来ません。',
      ]);
    }

    $this->service->delete($id);

    return $this->success();
  }

  /**
   * 明細（バリデーション）
   */
  public function detail(EstimateDetailRequest $request)
  {
    return $this->success();
  }

  /**
   * 見積書印刷
   */
  public function output(EstimateUpdateRequest $request)
  {
    $data = $this->service->getPdfData($request->validated());

    $pdf = new EstimatePdfService();
    $file_id = $pdf->createPdf($data);

    return $this->success([
      'file_id' => $file_id,
    ]);
  }
}