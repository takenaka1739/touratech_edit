<?php

namespace App\Web\Customer\Controllers;

use App\Base\Http\Controllers\Controller;
use App\Api\Customer\Services\CustomerExcelService;
use Illuminate\Support\Facades\Storage;

/**
 * 得意先マスタコントローラー
 */
class CustomerController extends Controller
{
  /**
   * エクセル出力
   */
  public function output_excel(string $file_id)
  {
    $pdf = new CustomerExcelService();
    $path = $pdf->getStoragePath($file_id);
    if (!Storage::exists($path)) {
      abort(404);
    }

    return response(Storage::get($path))
      ->header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      ->header('Content-Disposition', 'inline; filename="' . "得意先マスタ.xlsx" . '"');
  }
}
