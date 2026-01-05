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

  public function __construct(SalesService $service)
  {
    $this->service = $service;
  }

  public function dialog(Request $request)
  {
    $input = $request->all();
    $data = $this->service->dialog($input);

    return $this->success($data);
  }

  public function fetch(Request $request)
  {
    $input = $request->all();
    $data = $this->service->fetch($input);

    return $this->success($data);
  }

  public function edit($id = null)
  {
    if ($id) {
      $data = $this->service->get($id);
    } else {
      $data = $this->service->newData();
    }

    return $this->success($data);
  }

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
    // ここに出なければ「Controller未到達」
    \Log::warning('[SalesController@store] ENTER', [
      'content_type' => $request->header('content-type'),
      'origin'       => $request->header('origin'),
      'referer'      => $request->header('referer'),
      'payload_keys' => array_keys($request->all() ?? []),
      'sales_at_raw' => $request->input('sales_at'),
      'receive_order_id' => $request->input('receive_order_id'),
      'details_count' => is_array($request->input('details')) ? count($request->input('details')) : null,
    ]);

    try {
      $validated = $request->validated();

      \Log::warning('[SalesController@store] VALIDATED', [
        'keys' => array_keys($validated),
        'sales_at' => $validated['sales_at'] ?? null,
        'receive_order_id' => $validated['receive_order_id'] ?? null,
        'details_count' => isset($validated['details']) && is_array($validated['details']) ? count($validated['details']) : null,
      ]);

      $ret = $this->service->store($validated);

      \Log::warning('[SalesController@store] SERVICE_RETURN', $ret);

      if (!($ret['success'] ?? false)) {
        return $this->error('', $ret['errors'] ?? ['system' => '登録に失敗しました。']);
      }

      return $this->success([
        'id' => $ret['id'],
      ]);

    } catch (\Throwable $e) {
      \Log::error('[SalesController@store] EXCEPTION', [
        'type'    => get_class($e),
        'message' => $e->getMessage(),
        'code'    => $e->getCode(),
        'file'    => $e->getFile(),
        'line'    => $e->getLine(),
      ]);
      // ここは「500で落ちた」ことを返す（フロント側確認用）
      return response()->json([
        'success' => false,
        'message' => 'STORE_EXCEPTION',
      ], 500);
    }
  }

  public function validate_edit(SalesUpdateRequest $request, int $id)
  {
    $check = $this->service->validate_edit($id, $request->validated());
    return $this->success([
      "check" => $check,
    ]);
  }

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

  public function detail(SalesDetailRequest $request)
  {
    return $this->success();
  }

  public function output_delivery(SalesUpdateRequest $request)
  {
    $data = $this->service->getPdfData($request->validated());

    $pdf = new SalesPdfService();
    $file_id = $pdf->createPdf($data, "納品書");

    return $this->success([
      'file_id' => $file_id,
    ]);
  }

  public function output_invoice(SalesUpdateRequest $request)
  {
    $data = $this->service->getPdfData($request->validated());

    $pdf = new SalesPdfService();
    $file_id = $pdf->createPdf($data, "請求書");

    return $this->success([
      'file_id' => $file_id,
    ]);
  }

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
