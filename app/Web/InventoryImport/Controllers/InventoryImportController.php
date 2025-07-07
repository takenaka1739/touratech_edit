<?php

namespace App\Web\InventoryImport\Controllers;

use App\Base\Http\Controllers\Controller;
use App\Api\InventoryImport\Services\InventoryImportPdfService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

/**
 * 棚卸処理コントローラー
 */
class InventoryImportController extends Controller
{
  public function output(string $file_id)
  {
    $pdf = new InventoryImportPdfService();
    $path = $pdf->getStoragePath($file_id);
    if (!Storage::exists($path)) {
      abort(404);
    }
    return response(Storage::get($path))
      ->header('Content-Type', 'application/pdf')
      ->header('Content-Disposition', 'attachment; filename*=UTF-8\'\'' . rawurlencode("棚卸差分.pdf"));
  }
}
