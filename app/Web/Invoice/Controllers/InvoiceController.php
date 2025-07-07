<?php

namespace App\Web\Invoice\Controllers;

use App\Base\Http\Controllers\Controller;
use App\Api\Invoice\Services\InvoicePdfService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

/**
 * 請求データコントローラー
 */
class InvoiceController extends Controller
{
  /**
   * 請求書発行
   *
   * @param string $file_id
   */
  public function output_invoice(string $file_id)
  {
    $pdf = new InvoicePdfService();
    $path = $pdf->getStoragePath($file_id);
    if (!Storage::exists($path)) {
      abort(404);
    }
    return response(Storage::get($path))
      ->header('Content-Type', 'application/pdf')
      ->header('Content-Disposition', 'attachment; filename*=UTF-8\'\'' . rawurlencode("請求書.pdf"));
  }

  /**
   * 請求一覧出力
   *
   * @param string $file_id
   */
  public function output_list(string $file_id)
  {
    $pdf = new InvoicePdfService();
    $path = $pdf->getStoragePath($file_id);
    if (!Storage::exists($path)) {
      abort(404);
    }
    return response(Storage::get($path))
      ->header('Content-Type', 'application/pdf')
      ->header('Content-Disposition', 'attachment; filename*=UTF-8\'\'' . rawurlencode("請求一覧.pdf"));
  }
}
