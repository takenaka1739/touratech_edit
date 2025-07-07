<?php

namespace App\Api\InventoryPrinting\Services;

use App\Base\Pdf\PdfWrapper;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Exception;

class InventoryPrintingPdfService
{
  const PER_PAGE = 38;

  /** @var \App\Base\Pdf\PdfWrapper */
  protected $pdf;

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
   * PDFを作成する
   *
   * @param array $data
   * @return string
   */
  public function createPdf(array $data)
  {
    $data = new Collection($data);
    $import_month = $data->get('import_month');
    $rows = $data->get('data');

    $title = "在庫表（${import_month}）";
    $this->pdf = new PdfWrapper($title, "L");

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

    $count = count($rows) + 1;
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
    if ($count < $this::PER_PAGE) {
      $height = $height + $h;
    }
    $this->pdf->rect(16, $baseY, 265, $h, "F", [], [217, 217, 217]);
    $this->pdf->rect(16, $baseY, 265, $height);
    $this->pdf->lineH(46, $baseY, $height);
    $this->pdf->lineH(161, $baseY, $height);
    $this->pdf->lineH(181, $baseY, $height);
    $this->pdf->lineH(201, $baseY, $height);
    $this->pdf->lineH(221, $baseY, $height);
    $this->pdf->lineH(241, $baseY, $height);
    $this->pdf->lineH(261, $baseY, $height);

    $this->pdf->SetFontSize(9);
    $this->pdf->SetXY(16, $baseY);
    $this->pdf->Cell(30, $h, "品番", 0, 0, "C");
    $this->pdf->SetXY(46, $baseY);
    $this->pdf->Cell(115, $h, "商品名", 0, 0, "C");
    $this->pdf->SetXY(161, $baseY);
    $this->pdf->Cell(20, $h, "前月在庫数", 0, 0, "C");
    $this->pdf->SetXY(181, $baseY);
    $this->pdf->Cell(20, $h, "今月入庫数", 0, 0, "C");
    $this->pdf->SetXY(201, $baseY);
    $this->pdf->Cell(20, $h, "今月出庫数", 0, 0, "C");
    $this->pdf->SetXY(221, $baseY);
    $this->pdf->Cell(20, $h, "今月在庫数", 0, 0, "C");
    $this->pdf->SetXY(241, $baseY);
    $this->pdf->Cell(20, $h, "単価", 0, 0, "C");
    $this->pdf->SetXY(261, $baseY);
    $this->pdf->Cell(20, $h, "金額", 0, 0, "C");

    $this->pdf->SetFontSize(8);
    $y = $baseY;
    foreach ($data as $row) {
      $row = new Collection($row);

      $y = $y + $h;
      $this->pdf->lineW(16, $y, 265);

      $this->pdf->SetXY(16, $y);
      $this->pdf->Cell(30, $h, $row->get("item_number"), 0, 0, "C");
      $this->pdf->SetXY(46, $y);
      $this->pdf->Cell(115, $h, mb_strimwidth($row->get("item_name", ''), 0, 80));
      $this->pdf->SetXY(161, $y);
      $this->pdf->Cell(20, $h, number_format($row->get('pre_quantity'), 0), 0, 0, "R");
      $this->pdf->SetXY(181, $y);
      $this->pdf->Cell(20, $h, number_format($row->get('in'), 0), 0, 0, "R");
      $this->pdf->SetXY(201, $y);
      $this->pdf->Cell(20, $h, number_format($row->get('out'), 0), 0, 0, "R");
      $this->pdf->SetXY(221, $y);
      $this->pdf->Cell(20, $h, number_format($row->get('quantity'), 0), 0, 0, "R");
      $this->pdf->SetXY(241, $y);
      $this->pdf->Cell(20, $h, number_format($row->get('unit_price'), 2), 0, 0, "R");
      $this->pdf->SetXY(261, $y);
      $this->pdf->Cell(20, $h, number_format($row->get('amount'), 0), 0, 0, "R");
    }

    if ($count < $this::PER_PAGE) {
      // 合計
      $y = $y + $h;
      $this->pdf->lineW(16, $y, 265);

      $this->pdf->SetXY(46, $y);
      $this->pdf->Cell(55, $h, "合計");
      $this->pdf->SetXY(251, $y);

      $sum_amount = $rows->sum('amount');
      $this->pdf->Cell(30, $h, number_format($sum_amount, 0), 0, 0, "R");
    }

    $this->pdf->Text(0, 201, $page . "/" . $max_page, false, false, true, 0, 0, "C");
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