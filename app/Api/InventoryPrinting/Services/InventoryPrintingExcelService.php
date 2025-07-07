<?php

namespace App\Api\InventoryPrinting\Services;

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
class InventoryPrintingExcelService
{
  /** @var string */
  protected $base_path;

  public function __construct()
  {
    $this->base_path = config('const.paths.inventory_printing.output_path');
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
   * @param array $data
   * @return string
   */
  public function createExcel(array $data)
  {
    $data = new Collection($data);
    $rows = $data->get('data');
    $rows = new Collection($rows);
    
    $spreadsheet = new Spreadsheet();

    $sheet = $spreadsheet->getActiveSheet();

    $sheet->setCellValue('A1', '品番');
    $sheet->setCellValue('B1', '商品名');
    $sheet->setCellValue('C1', '前月在庫数');
    $sheet->setCellValue('D1', '今月入庫数');
    $sheet->setCellValue('E1', '今月出庫数');
    $sheet->setCellValue('F1', '今月在庫数');
    $sheet->setCellValue('G1', '単価');
    $sheet->setCellValue('H1', '金額');

    $y = 2;
    foreach ($rows as $row)
    {
      $row = new Collection($row);

      $sheet->setCellValue('A'.$y, $row->get("item_number"));
      $sheet->setCellValue('B'.$y, $row->get("item_name", ''));
      $sheet->setCellValue('C'.$y, number_format($row->get('pre_quantity'), 0));
      $sheet->setCellValue('D'.$y, number_format($row->get('in'), 0));
      $sheet->setCellValue('E'.$y, number_format($row->get('out'), 0));
      $sheet->setCellValue('F'.$y, number_format($row->get('quantity'), 0));
      $sheet->setCellValue('G'.$y, number_format($row->get('unit_price'), 2));
      $sheet->setCellValue('H'.$y, number_format($row->get('amount'), 0));

      $y++;
    }

    $sheet->setCellValue('A'.$y, "合計");
    $sum_amount = $rows->sum('amount');
    $sheet->setCellValue('H'.$y, number_format($sum_amount, 0), 0);

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