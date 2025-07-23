<?php

namespace App\Api\Sales\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\Sales\Requests\SalesStoreRequest;
use App\Api\Sales\Requests\SalesUpdateRequest;
use App\Api\Sales\Requests\SalesDetailRequest;
use App\Api\Sales\Services\SalesService;
use App\Api\Sales\Services\SalesPdfService;
use App\Api\Sales\Services\SalesExcelService;
use Illuminate\Http\Request;

/**
 * 売上データコントローラー
 */
class SalesController extends BaseController
{
  /** @var \App\Api\Sales\Services\SalesService */
  protected $service;

  /**
   * @param \App\Api\Sales\Services\SalesService $service
   */
  public function __construct(SalesService $service)
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
   * @param mixed $id 売上ID
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
   * 詳細画面（受注ID）
   *
   * @param mixed $id 受注ID
   */
  public function edit_by_receive_id($id)
  {
    $data = $this->service->get_by_receive_id($id);

    return $this->success($data);
  }

  /**
   * 登録
   */
  public function store(SalesStoreRequest $request)
  {
    $ret = $this->service->store($request->validated());
    if (!$ret["success"]) {
      return $this->error("", $ret["errors"]);
    }

    return $this->success([
      'id' => $ret['id']
    ]);
  }

  /**
   * バリデーション（更新）
   *
   * @param int $id 売上ID
   */
  public function validate_edit(SalesUpdateRequest $request, int $id)
  {
    $check = $this->service->validate_edit($id, $request->validated());
    return $this->success([
      "check" => $check,
    ]);
  }

  /**
   * 更新
   *
   * @param int $id 売上ID
   */
  public function update(SalesUpdateRequest $request, int $id)
  {
    if ($this->service->hasInvoice($id)) {
      return $this->error("", [
        'has_invoice' => '既に請求データが存在するため、データの編集は出来ません。',
      ]);
    }

    $ret = $this->service->update($id, $request->validated());
    if (!$ret["success"]) {
      return $this->error("", $ret["errors"]);
    }

    return $this->success();
  }

  /**
   * 削除
   *
   * @param int $id 売上ID
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
   * 明細（バリデーション）
   */
  public function detail(SalesDetailRequest $request)
  {
    return $this->success();
  }

  /**
   * 納品書印刷
   */
  public function output_delivery(SalesUpdateRequest $request)
  {
    $data = $this->service->getPdfData($request->validated());

    $pdf = new SalesPdfService();
    $file_id = $pdf->createPdf($data, "納品書");

    return $this->success([
      'file_id' => $file_id,
    ]);
  }

  /**
   * 請求書印刷
   */
  public function output_invoice(SalesUpdateRequest $request)
  {
    $data = $this->service->getPdfData($request->validated());

    $pdf = new SalesPdfService();
    $file_id = $pdf->createPdf($data, "請求書");

    return $this->success([
      'file_id' => $file_id,
    ]);
  }
    
  /**
   * エクセル出力
   */
  public function output_excel(Request $request)
  {
    $input = $request->all();
    $rows = $this->service->getExcelData($input);

    $excel = new SalesExcelService();
    $file_id = $excel->createExcel($rows);
    return $this->success([
      'file_id' => $file_id,
    ]);
  }
}