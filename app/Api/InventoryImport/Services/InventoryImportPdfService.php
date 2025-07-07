<?php

namespace App\Api\InventoryImport\Services;

use App\Base\Pdf\PdfWrapper;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use Exception;

/**
 * 棚卸差分PDFサービス
 */
class InventoryImportPdfService
{
  const PER_PAGE = 57;

  /** @var \App\Base\Pdf\PdfWrapper */
  protected $pdf;

  /** @var string */
  protected $base_path;

  public function __construct()
  {
    $this->base_path = config('const.paths.inventory_import.output_path');
  }

  /**
   * @return string
   */
  public function getBasePath()
  {
    return $this->base_path;
  }

  /**
   * PDFを作成する
   *
   * @param array $data
   * @return string
   */
  public function createPdf(array $data)
  {
    $data = new Collection($data);
    $invoice_month = $data->get('inventory_month');
    $rows = $data->get('data');

    $title = "差分印刷（${invoice_month}）";
    $this->pdf = new PdfWrapper($title);

    $this->write($title, $rows);

    $prefix = Carbon::now()->format('Ymd');
    $file_id = $this->getFileId($prefix);
    $path = app_storage_path($this->getStoragePath($file_id));

    $this->pdf->Output($path, 'F');
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
   * 書き込む
   *
   * @param string $title
   * @param array $rows
   */
  protected function write(string $title, array $rows)
  {
    $this->pdf->SetFont('msgothic');

    $count = count($rows);
    $max_page = Ceil($count / $this::PER_PAGE);

    for ($i = 1; $i <= $max_page; $i++) {
      $this->writePage($title, $rows, $i, $max_page);
    }
  }

  /**
   * ページを出力する
   *
   * @param string $title
   * @param array $rows
   * @param int $page
   * @param int $max_page
   */
  protected function writePage(
    string $title,
    array $rows,
    int $page,
    int $max_page
    )
  {
    $rows = new Collection($rows);
    $data = $rows->forPage($page, $this::PER_PAGE);
    $count = $data->count();

    $this->pdf->addPage();

    // タイトル
    $this->pdf->SetFontSize(10);
    $this->pdf->Text(0, 8, $title, false, false, true, 0, 0, "C");

    $this->pdf->setLineStyleWidthNormal(0.2);
    $this->pdf->LineNormal();
    $baseY = 16;
    $h = 4.6;
    $height = $h * ($count + 1);
    $this->pdf->rect(16, $baseY, 178, $h, "F", [], [217, 217, 217]);
    $this->pdf->rect(16, $baseY, 178, $height);
    $this->pdf->lineH(46, $baseY, $height);
    $this->pdf->lineH(154, $baseY, $height);
    $this->pdf->lineH(174, $baseY, $height);

    $this->pdf->SetFontSize(9);
    $this->pdf->SetXY(16, $baseY);
    $this->pdf->Cell(30, $h, "品番", 0, 0, "C");
    $this->pdf->SetXY(46, $baseY);
    $this->pdf->Cell(108, $h, "商品名", 0, 0, "C");
    $this->pdf->SetXY(154, $baseY);
    $this->pdf->Cell(20, $h, "取込件数", 0, 0, "C");
    $this->pdf->SetXY(174, $baseY);
    $this->pdf->Cell(20, $h, "在庫件数", 0, 0, "C");

    $this->pdf->SetFontSize(8);
    $y = $baseY;
    foreach ($data as $row) {
      $row = new Collection($row);

      $y = $y + $h;
      $this->pdf->lineW(16, $y, 178);

      $this->pdf->SetXY(16, $y);
      $this->pdf->Cell(30, $h, $row->get("item_number"), 0, 0, "C");
      $this->pdf->SetXY(46, $y);
      $this->pdf->Cell(120, $h, $row->get("item_name"));
      $this->pdf->SetXY(154, $y);
      $this->pdf->Cell(20, $h, number_format($row->get('quantity')), 0, 0, "R");
      $this->pdf->SetXY(174, $y);
      $this->pdf->Cell(20, $h, number_format($row->get('stocks')), 0, 0, "R");
    }

    $this->pdf->Text(0, 288, $page . "/" . $max_page, false, false, true, 0, 0, "C");
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