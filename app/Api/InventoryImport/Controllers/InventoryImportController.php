<?php

namespace App\Api\InventoryImport\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\InventoryImport\Services\InventoryImportService;
use App\Api\InventoryImport\Services\InventoryImportPdfService;
use App\Api\InventoryImport\Requests\InventoryImportFetchRequest;
use App\Api\InventoryImport\Requests\InventoryImportUploadRequest;
use App\Api\InventoryImport\Requests\InventoryImportDetailRequest;
use App\Api\InventoryImport\Requests\InventoryImportOutputRequest;
use App\Api\InventoryImport\Requests\InventoryImportConfirmRequest;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * 棚卸処理コントローラー
 */
class InventoryImportController extends BaseController
{
  /** @var \App\Api\InventoryImport\Services\InventoryImportService */
  protected $service;

  /**
   * @param \App\Api\InventoryImport\Services\InventoryImportService $service
   */
  public function __construct(InventoryImportService $service)
  {
    $this->service = $service;
  }

  /**
   * 読込
   */
  public function fetch(InventoryImportFetchRequest $request)
  {
    $validated = $request->validated();

    try {
      $data = $this->service->fetch($validated);
      $data["hasInventory"] = $this->service->hasInventory($validated);
      $data["hasInventoryImport"] = $this->service->hasInventoryImport($validated);
      return $this->success($data);
    } catch (Throwable $e) {
      Log::error('[InventoryImportController][fetch] failed', [
        'validated' => $validated,
        'exception' => get_class($e),
        'message' => $e->getMessage(),
      ]);
      return $this->error('棚卸データの取得に失敗しました。');
    }
  }

  /**
   * 発送予定取込バリデーション
   */
  public function validate_upload(InventoryImportUploadRequest $request)
  {
    $validated = $request->validated();

    if ($this->service->hasInventory($validated)) {
      return $this->error("", [
        'has_inventory' => '既に棚卸確定済の年月のため、取込を行うことができません。',
      ]);
    }

    return $this->success();
  }

  /**
   * 発送予定取込
   */
  public function upload(InventoryImportUploadRequest $request)
  {
    $validated = $request->validated();

    // 既に確定済みなら、例外ではなく「意味のあるエラー」を返す
    if ($this->service->hasInventory($validated)) {
      return $this->error("", [
        'has_inventory' => '既に棚卸確定済の年月のため、取込を行うことができません。',
      ]);
    }

    try {
      $this->service->upload($request->file('file')->path(), $validated);

      $data = $this->service->fetch($validated);
      $data["hasInventory"] = $this->service->hasInventory($validated);
      $data["hasInventoryImport"] = $this->service->hasInventoryImport($validated);

      return $this->success($data);
    } catch (Throwable $e) {
      Log::error('[InventoryImportController][upload] failed', [
        'validated' => $validated,
        'exception' => get_class($e),
        'message' => $e->getMessage(),
      ]);

      // フロント側が errors を見ている想定で返す（必要ならキー名は画面側に合わせて）
      return $this->error('棚卸取込に失敗しました。', [
        'upload' => $e->getMessage() ?: '不明なエラー',
      ]);
    }
  }

  /**
   * 明細
   */
  public function detail(InventoryImportDetailRequest $request)
  {
    $validated = $request->validated();

    try {
      $this->service->update($validated);
      return $this->success();
    } catch (Throwable $e) {
      Log::error('[InventoryImportController][detail] failed', [
        'validated' => $validated,
        'exception' => get_class($e),
        'message' => $e->getMessage(),
      ]);
      return $this->error('明細更新に失敗しました。', [
        'detail' => $e->getMessage() ?: '不明なエラー',
      ]);
    }
  }

  /**
   * 一覧出力
   */
  public function output(InventoryImportOutputRequest $request)
  {
    $validated = $request->validated();

    try {
      $data = $this->service->getPdfData($validated);

      $pdf = new InventoryImportPdfService();
      $file_id = $pdf->createPdf($data);

      return $this->success([
        'file_id' => $file_id,
      ]);
    } catch (Throwable $e) {
      Log::error('[InventoryImportController][output] failed', [
        'validated' => $validated,
        'exception' => get_class($e),
        'message' => $e->getMessage(),
      ]);
      return $this->error('PDF出力に失敗しました。', [
        'output' => $e->getMessage() ?: '不明なエラー',
      ]);
    }
  }

  /**
   * 在庫確定
   */
  public function confirm(InventoryImportConfirmRequest $request)
  {
    $validated = $request->validated();

    // 既に確定済みなら、例外ではなく「意味のあるエラー」を返す
    if ($this->service->hasInventory($validated)) {
      return $this->error("", [
        'has_inventory' => '既に棚卸確定済の年月のため、確定を行うことができません。',
      ]);
    }

    try {
      $this->service->confirm($validated);
      return $this->success();
    } catch (Throwable $e) {
      Log::error('[InventoryImportController][confirm] failed', [
        'validated' => $validated,
        'exception' => get_class($e),
        'message' => $e->getMessage(),
      ]);

      return $this->error('在庫確定に失敗しました。', [
        'confirm' => $e->getMessage() ?: '不明なエラー',
      ]);
    }
  }
}
