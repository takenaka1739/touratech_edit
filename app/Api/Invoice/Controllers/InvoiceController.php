<?php

namespace App\Api\Invoice\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\Invoice\Requests\InvoiceFetchRequest;
use App\Api\Invoice\Requests\InvoiceClosingRequest;
use App\Api\Invoice\Requests\InvoiceOutputRequest;
use App\Api\Invoice\Requests\InvoiceOutputListRequest;
use App\Api\Invoice\Services\InvoiceService;
use App\Api\Invoice\Services\InvoicePdfService;
use App\Api\Invoice\Services\InvoiceListPdfService;

/**
 * 請求データコントローラー
 */
class InvoiceController extends BaseController
{
  /** @var \App\Api\Invoice\Services\InvoiceService */
  protected $service;

  /**
   * @param \App\Api\Invoice\Services\InvoiceService $service
   */
  public function __construct(InvoiceService $service)
  {
    $this->service = $service;
  }

  /**
   * 一覧画面
   */
  public function fetch(InvoiceFetchRequest $request)
  {
    $input = $request->all();
    $data = $this->service->fetch($input);

    return $this->success($data);
  }

  /**
   * 月締処理バリデーション
   */
  public function validate_closing(InvoiceClosingRequest $request)
  {
    $has_closing = $this->service->hasClosing($request->validated());
    return $this->success([
      'has_closing' => $has_closing
    ]);
  }

  /**
   * 月締処理
   */
  public function closing(InvoiceClosingRequest $request)
  {
    $this->service->closing($request->validated());
    return $this->success();
  }

  /**
   * 月締取消処理
   */
  public function cancel_closing(InvoiceClosingRequest $request)
  {
    $this->service->cancelClosing($request->validated());
    return $this->success();
  }

  /**
   * 請求書印刷
   */
  public function output_invoice(InvoiceOutputRequest $request)
  {
    $data = $this->service->getPdfData($request->validated());

    $pdf = new InvoicePdfService();
    $file_id = $pdf->createPdf($data);

    return $this->success([
      'file_id' => $file_id,
    ]);
  }

  /**
   * 請求一覧出力
   */
  public function output_list(InvoiceOutputListRequest $request)
  {
    $data = $this->service->getListPdfData($request->validated());

    $pdf = new InvoiceListPdfService();
    $file_id = $pdf->createPdf($data);

    return $this->success([
      'file_id' => $file_id,
    ]);
  }
}