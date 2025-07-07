<?php

namespace App\Api\Item\Services;

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
class ItemExcelService
{
  /** @var string */
  protected $base_path;

  public function __construct()
  {
    $this->base_path = config('const.paths.item.output_path');
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

    $sheet->setCellValue('A1', '品番');
    $sheet->setCellValue('B1', '商品名');
    $sheet->setCellValue('C1', '商品名（納品書）');
    $sheet->setCellValue('D1', '売上単価');
    $sheet->setCellValue('E1', '仕入単価');
    $sheet->setCellValue('F1', '国内在庫');
    $sheet->setCellValue('G1', '国外在庫');

    $y = 2;
    foreach ($rows as $row)
    {
      $row = new Collection($row);

      $sheet->setCellValue('A'.$y, $row->get("item_number"));
      $sheet->setCellValue('B'.$y, $row->get("name", ''));
      $sheet->setCellValue('C'.$y, $row->get("name_jp", ''));
      $sheet->setCellValue('D'.$y, $row->get('sales_unit_price'));
      $sheet->setCellValue('E'.$y, $row->get('purchase_unit_price'));
      $sheet->setCellValue('F'.$y, $row->get('domestic_stock'));
      $sheet->setCellValue('G'.$y, $row->get('overseas_stock'));

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