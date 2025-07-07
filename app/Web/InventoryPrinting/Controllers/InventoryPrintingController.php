<?php

namespace App\Web\InventoryPrinting\Controllers;

use App\Base\Http\Controllers\Controller;
use App\Api\InventoryPrinting\Services\InventoryPrintingPdfService;
use App\Api\InventoryPrinting\Services\InventoryPrintingExcelService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

/**
 * 在庫表印刷コントローラー
 */
class InventoryPrintingController extends Controller
{
  /**
   * 在庫表発行
   */
  public function print(string $file_id)
  {
    $pdf = new InventoryPrintingPdfService();
    $path = $pdf->getStoragePath($file_id);
    if (!Storage::exists($path)) {
      abort(404);
    }
    return response(Storage::get($path))
      ->header('Content-Type', 'application/pdf')
      ->header('Content-Disposition', 'attachment; filename*=UTF-8\'\'' . rawurlencode("在庫表.pdf"));
  }

  /**
   * 在庫表出力
   */
  public function output(string $file_id)
  {
    $pdf = new InventoryPrintingExcelService();
    $path = $pdf->getStoragePath($file_id);
    if (!Storage::exists($path)) {
      abort(404);
    }

    $ymd = Carbon::now()->format('Ymd');

    return response(Storage::get($path))
      ->header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      ->header('Content-Disposition', 'inline; filename="' . "棚卸表_" . $ymd . ".xlsx" . '"');
  }

}
