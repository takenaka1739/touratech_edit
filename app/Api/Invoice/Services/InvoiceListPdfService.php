<?php

namespace App\Api\Invoice\Services;

use App\Base\Pdf\PdfWrapper;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use Exception;

/**
 * 請求一覧PDFサービス
 */
class InvoiceListPdfService
{
  const PER_PAGE = 57;

  /** @var \App\Base\Pdf\PdfWrapper */
  protected $pdf;

  /** @var string */
  protected $base_path;

  public function __construct()
  {
    $this->base_path = config('const.paths.invoice.output_path');
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
    $invoice_month = $data->get('invoice_month');
    $rows = $data->get('data');

    $title = "請求一覧（{$invoice_month}）";
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
    $this->pdf->rect(16, $baseY, 178, $h, "F", [], [217, 217, 217]);
    $this->pdf->rect(16, $baseY, 178, $height);
    $this->pdf->lineH(36, $baseY, $height);
    $this->pdf->lineH(98, $baseY, $height);
    $this->pdf->lineH(122, $baseY, $height);
    $this->pdf->lineH(146, $baseY, $height);
    $this->pdf->lineH(170, $baseY, $height);

    $this->pdf->SetFontSize(9);
    $this->pdf->SetXY(16, $baseY);
    $this->pdf->Cell(20, $h, "請求日", 0, 0, "C");
    $this->pdf->SetXY(36, $baseY);
    $this->pdf->Cell(62, $h, "得意先", 0, 0, "C");
    $this->pdf->SetXY(98, $baseY);
    $this->pdf->Cell(24, $h, "前回請求額", 0, 0, "C");
    $this->pdf->SetXY(122, $baseY);
    $this->pdf->Cell(24, $h, "入金額", 0, 0, "C");
    $this->pdf->SetXY(146, $baseY);
    $this->pdf->Cell(24, $h, "買上計", 0, 0, "C");
    $this->pdf->SetXY(170, $baseY);
    $this->pdf->Cell(24, $h, "今回請求額", 0, 0, "C");

    $this->pdf->SetFontSize(8);
    $y = $baseY;
    foreach ($data as $row) {
      $row = new Collection($row);

      $y = $y + $h;
      $this->pdf->lineW(16, $y, 178);

      $this->pdf->SetXY(16, $y);
      $this->pdf->Cell(20, $h, $row->get("invoice_date"), 0, 0, "C");
      $this->pdf->SetXY(36, $y);
      $this->pdf->Cell(62, $h, $row->get("customer_name"), 0, 0, "", false, "", 1);

      $this->pdf->SetXY(98, $y);
      $this->pdf->Cell(24, $h, number_format($row->get("pre_amount") ?? 0, 0), 0, 0, "R", false, "", 1);
      $this->pdf->SetXY(122, $y);
      $this->pdf->Cell(24, $h, number_format($row->get("total_receipt") ?? 0, 0), 0, 0, "R", false, "", 1);
      $this->pdf->SetXY(146, $y);
      $this->pdf->Cell(24, $h, number_format($row->get("total_amount") ?? 0, 0), 0, 0, "R", false, "", 1);
      $this->pdf->SetXY(170, $y);
      $this->pdf->Cell(24, $h, number_format($row->get("total_invoice") ?? 0, 0), 0, 0, "R", false, "", 1);
    }

    if ($count < $this::PER_PAGE) {
      // 合計
      $y = $y + $h;
      $this->pdf->lineW(16, $y, 178);

      $this->pdf->SetXY(36, $y);
      $this->pdf->Cell(64, $h, "合計");

      $this->pdf->SetXY(98, $y);
      $this->pdf->Cell(24, $h, number_format($rows->sum('pre_amount'), 0), 0, 0, "R", false, "", 1);
      $this->pdf->SetXY(122, $y);
      $this->pdf->Cell(24, $h, number_format($rows->sum('total_receipt'), 0), 0, 0, "R", false, "", 1);
      $this->pdf->SetXY(146, $y);
      $this->pdf->Cell(24, $h, number_format($rows->sum('total_amount'), 0), 0, 0, "R", false, "", 1);
      $this->pdf->SetXY(170, $y);
      $this->pdf->Cell(24, $h, number_format($rows->sum('total_invoice'), 0), 0, 0, "R", false, "", 1);
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