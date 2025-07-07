<?php

namespace App\Web\Sales\Controllers;

use App\Base\Http\Controllers\Controller;
use App\Api\Sales\Services\SalesPdfService;
use App\Api\Sales\Services\SalesExcelService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

/**
 * 売上データコントローラー
 */
class SalesController extends Controller
{
  public function output_delivery(string $file_id)
  {
    $pdf = new SalesPdfService();
    $path = $pdf->getStoragePath($file_id);
    if (!Storage::exists($path)) {
      abort(404);
    }
    return response(Storage::get($path))
      ->header('Content-Type', 'application/pdf')
      ->header('Content-Disposition', 'attachment; filename*=UTF-8\'\'' . rawurlencode("納品書.pdf"));
  }

  public function output_invoice(string $file_id)
  {
    $pdf = new SalesPdfService();
    $path = $pdf->getStoragePath($file_id);
    if (!Storage::exists($path)) {
      abort(404);
    }
    return response(Storage::get($path))
      ->header('Content-Type', 'application/pdf')
      ->header('Content-Disposition', 'attachment; filename*=UTF-8\'\'' . rawurlencode("請求書.pdf"));
  }
  
  /**
   * エクセル出力
   */
  public function output_excel(string $file_id)
  {
    $pdf = new SalesExcelService();
    $path = $pdf->getStoragePath($file_id);
    if (!Storage::exists($path)) {
      abort(404);
    }

    return response(Storage::get($path))
      ->header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      ->header('Content-Disposition', 'inline; filename="' . "売上データ.xlsx" . '"');
  }
}
