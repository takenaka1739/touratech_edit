<?php

namespace App\Api\Sales\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx As XlsxWriter;
use Carbon\Carbon;
use Exception;
use PhpOffice\PhpSpreadsheet\Spreadsheet;

/**
 * 
 */
class SalesExcelService
{
  /** @var string */
  protected $base_path;

  public function __construct()
  {
    $this->base_path = config('const.paths.sales.output_path');
  }

  /**
   * @return string
   */
  public function getBasePath()
  {
    return $this->base_path;
  }
  
  /**
   * Excelを作成する
   *
   * @param Collection $rows
   * @return string
   */
  public function createExcel($rows)
  {
    $spreadsheet = new Spreadsheet();

    $sheet = $spreadsheet->getActiveSheet();

    $sheet->setCellValue('A1', '売上日');
    $sheet->setCellValue('B1', '得意先名');
    $sheet->setCellValue('C1', '担当者');
    $sheet->setCellValue('D1', '金額');

    $y = 2;
    foreach ($rows as $row)
    {
      $row = new Collection($row);

      $sheet->setCellValue('A'.$y, $row->get("sales_date"));
      $sheet->setCellValue('B'.$y, $row->get("customer_name", ''));
      $sheet->setCellValue('C'.$y, $row->get("user_name", ''));
      $sheet->setCellValue('D'.$y, $row->get('total_amount'));

      $y++;
    }

    $writer = new XlsxWriter($spreadsheet);

    $prefix = Carbon::now()->format('Ymd');
    $file_id = $this->getFileId($prefix);
    $path = app_storage_path($this->getStoragePath($file_id));

    $writer->save($path);
    return $file_id;
  }

  /**
   * パスを取得する
   *
   * @param string $file_id
   * @return string
   */
  public function getStoragePath(string $file_id)
  {
    if (!strpos($file_id, '_')) {
      throw new Exception("Failed get path.");
    }

    list($ymd, $file_name) = explode('_', $file_id);
    $path = $this->base_path . $ymd . DIRECTORY_SEPARATOR;

    Storage::makeDirectory($path);

    return $path . $file_name;
  }
  
  /**
   * ファイルIDを取得する
   *
   * @param string $prefix
   * @return string
   */
  private function getFileId(string $prefix)
  {
    return $prefix . "_" . Str::random(32);
  }
}