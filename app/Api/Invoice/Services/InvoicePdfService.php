<?php

namespace App\Api\Invoice\Services;

use App\Base\Models\Config;
use App\Base\Pdf\PdfWrapper;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use Exception;

/**
 * 請求書PDFサービス
 */
class InvoicePdfService
{
  const PER_PAGE = 48;

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
   * @param array $cond 条件
   * @return string
   */
  public function createPdf(array $data)
  {
      $this->pdf = new PdfWrapper("請求書");

      $this->write($data);

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
   * @param array $data
   */
  protected function write(array $data)
  {
    $data = new Collection($data);

    $rows = $data->get('data');
    foreach ($rows as $row) {
      $details = $row["details"];

      $count = count($details);
      if ($count == 0) {
        $count = 1;
      }
      $max_page = Ceil($count / $this::PER_PAGE);

      for ($i = 1; $i <= $max_page; $i++) {
        $this->writePage($row, $i, $max_page);
      }
    }
  }

  /**
   * 書き込む
   *
   * @param array $data
   * @param int $page
   * @param int $max_page
   */
  protected function writePage(
    array $data,
    int $page,
    int $max_page
  )
  {
    $this->pdf->addPage();

    $data = new Collection($data);
    $config = new Collection($data->get('config_data'));
    $customer = new Collection($data->get('customer_data'));

    // タイトル
    $this->pdf->SetFontSize(18);
    $this->pdf->SetXY(110, 6.3);
    $this->pdf->Cell(30, 6.1, "請求書", 0, 0, "", false, "", 4);

    // 郵便番号
    $this->pdf->SetFontSize(12);
    $this->pdf->Text(24.16, 16.50, "〒　" . $data->get('zip_code', ""));

    // 宛先
    $this->pdf->SetFontSize(12);
    $this->pdf->Text(23.38, 20.82, $data->get('address1', ''));
    $this->pdf->Text(23.38, 25.42, $data->get('address2', ''));
    $this->pdf->Text(23.38, 33.65, $data->get('customer_name') . "　様");

    $this->pdf->SetFontSize(7);
    $this->pdf->Text(23.38, 48.26, "お客様コードNo.");
    $this->pdf->SetFontSize(11);
    $this->pdf->Text(43.41, 47.18, $data->get('user_id', ''));
    $this->pdf->LineW(23.38, 51.29, 35.19);

    // 日付
    $y = "";
    $m = "";
    $d = "";
    $date = $data->get('invoice_date');
    if ($date) {
      $dt = new Carbon($date);
      $y = $dt->year;
      $m = $dt->month;
      $d = $dt->day;
    }
    $this->pdf->SetFontSize(9);
    $this->pdf->TextRight(124.75, 18, $y);
    $this->pdf->Text(126.061, 18, '年');
    $this->pdf->TextRight(136.417, 18, $m);
    $this->pdf->Text(137.91, 18, '月');
    $this->pdf->TextRight(149.11, 18, $d);
    $this->pdf->Text(150.4, 18, '日');

    $this->pdf->LineW(112.29, 21.58, 47.24);

    $this->pdf->Text(170, 18, 'No.');
    $this->pdf->TextRight(192.91, 18, $data->get('id'));
    $this->pdf->LineW(169.29, 21.58, 31.17);

    // 自社名
    $this->pdf->SetFontSize(14);
    $this->pdf->Text(112.76, 25.93, $config->get('company_name'));

    $this->pdf->SetFontSize(9);
    $this->pdf->Text(112, 32.81, $config->get('zip_code', ''));
    $this->pdf->Text(127.49, 32.81, $config->get('address1', '').$config->get('address2'));
    $this->pdf->Text(127.49, 36.74, 'TEL:'.$config->get('tel', ''));
    $this->pdf->Text(162.46, 36.74, 'FAX:'.$config->get('fax', ''));

    $bank_name = $config->get('bank_name1', '');
    $branch_name = $config->get('branch_name1', '');
    $account_type = $config->get('account_type1', '');
    $account_number = $config->get('account_number1', '');
    $account_name = $config->get('account_name1');
    if ($customer->get('bank_class') == 2) {
      $bank_name = $config->get('bank_name2', '');
      $branch_name = $config->get('branch_name2', '');
      $account_type = $config->get('account_type2', '');
      $account_number = $config->get('account_number2', '');
      $account_name = $config->get('account_name2');
    }
    $this->pdf->Text(127.49, 40.67, $bank_name.$branch_name);
    $this->pdf->Text(127.49, 44.6, $account_type . '　' . $account_number);
    $this->pdf->Text(119.64, 48.53, '振込先口座名義：'.$account_name);

    $this->pdf->SetLineStyle(['width' => 0.3]);
    $this->pdf->rect(64.5, 44.4, 45.22, 8.03);
    $this->pdf->SetFontSize(17);
    $this->pdf->SetXY(64.5, 44.4);
    $this->pdf->Cell(45.22, 8.03, "請求書在中", 0, 0, "C");

    $this->pdf->SetFontSize(9);
    $this->pdf->Text(9.54, 58.93, "毎度ありがとうございます。");
    $this->pdf->Text(9.54, 63.45, "下記の通り御請求申し上げます。");

    $deadline = "";
    $date = $data->get('invoice_date');
    if ($date) {
      $dt = new Carbon($date);
      $deadline = $dt->addMonthNoOverflow()->endOfMonth()->format('Y/m/d');
    }
    $this->pdf->SetFontSize(11);
    $this->pdf->Text(68.56, 58.93, "お支払期限：".$deadline);
    $this->pdf->SetFontSize(8);
    $this->pdf->Text(68.56, 63.85, "（振込手数料はお客様負担でお願い致します。）");

    // ロゴ
    $this->pdf->Image(resource_path('images/logo.gif'), 122.59, 52.99, 47.76);

    $this->pdf->lineNormal();
    $this->pdf->rect(172.54, 51.74, 30.15, 14.66);
    $this->pdf->lineH(187.075, 51.93, 14.66);

    $this->pdf->rect(9.54, 68.26, 163.8, 10.05);
    $this->pdf->lineW(9.54, 72.34, 163.8);
    $this->pdf->lineH(36.75, 68.26, 10.05);
    $this->pdf->lineH(64.05, 68.26, 10.05);
    $this->pdf->lineH(91.35, 68.26, 10.05);
    $this->pdf->lineH(118.65, 68.26, 10.05);
    $this->pdf->lineH(145.95, 68.26, 10.05);

    $this->pdf->rect(175.56, 68.26, 27.15, 10.05);
    $this->pdf->lineW(175.56, 72.34, 27.15);

    $this->pdf->SetFontSize(7);
    $this->pdf->SetXY(9.54, 68.26);
    $this->pdf->Cell(27.3, 4.08, "前回御請求額", 0, 0, "C");
    $this->pdf->SetFontSize(10);
    $this->pdf->SetXY(9.54, 72.34);
    $this->pdf->Cell(27.3, 5.97, number_format($data->get('pre_amount'), 0), 0, 0, "R");

    $this->pdf->SetFontSize(7);
    $this->pdf->SetXY(36.75, 68.26);
    $this->pdf->Cell(27.3, 4.08, "御 入 金 額", 0, 0, "C");
    $this->pdf->SetFontSize(10);
    $this->pdf->SetXY(36.75, 72.34);
    $this->pdf->Cell(27.3, 5.97, number_format($data->get('total_receipt'), 0), 0, 0, "R");

    $this->pdf->SetFontSize(7);
    $this->pdf->SetXY(64.05, 68.26);
    $this->pdf->Cell(27.3, 4.08, "繰 越 金 額", 0, 0, "C");
    $this->pdf->SetFontSize(10);
    $this->pdf->SetXY(64.05, 72.34);
    $this->pdf->Cell(27.3, 5.97, number_format($data->get('carried_forward'), 0), 0, 0, "R");

    $this->pdf->SetFontSize(7);
    $this->pdf->SetXY(91.35, 68.26);
    $this->pdf->Cell(27.3, 4.08, "御 買 上 額", 0, 0, "C");
    $this->pdf->SetFontSize(10);
    $this->pdf->SetXY(91.35, 72.34);
    $this->pdf->Cell(27.3, 5.97, number_format($data->get('total_amount', 0) - $data->get('total_tax', 0), 0), 0, 0, "R");

    $this->pdf->SetFontSize(7);
    $this->pdf->SetXY(118.65, 68.26);
    $this->pdf->Cell(27.3, 4.08, "消費税額（10％）", 0, 0, "C");
    $this->pdf->SetFontSize(10);
    $this->pdf->SetXY(118.65, 72.34);
    $this->pdf->Cell(27.3, 5.97, number_format($data->get('total_tax'), 0), 0, 0, "R");

    $this->pdf->SetFontSize(7);
    $this->pdf->SetXY(145.95, 68.26);
    $this->pdf->Cell(27.3, 4.08, "御 買 上 計", 0, 0, "C");
    $this->pdf->SetFontSize(10);
    $this->pdf->SetXY(145.95, 72.34);
    $this->pdf->Cell(27.3, 5.97, number_format($data->get('total_amount', 0), 0), 0, 0, "R");

    $this->pdf->SetFontSize(7);
    $this->pdf->SetXY(175.56, 68.26);
    $this->pdf->Cell(27.3, 4.08, "今回御請求額", 0, 0, "C");
    $this->pdf->SetFontSize(10);
    $this->pdf->SetXY(175.56, 72.34);
    $this->pdf->Cell(27.3, 5.97, number_format($data->get('total_invoice'), 0), 0, 0, "R");


    $this->pdf->rect(9.54, 80.63, 193.17, 210);

    $this->pdf->SetFontSize(8);
    $this->pdf->SetXY(9.54, 80.63);
    $this->pdf->Cell(21.7, 5.04, "伝票日付", 0, 0, "C");
    $this->pdf->SetXY(31.24, 80.63);
    $this->pdf->Cell(23.18, 5.04, "伝　票　No.", 0, 0, "C");
    $this->pdf->SetXY(54.42, 80.63);
    $this->pdf->Cell(64.83, 5.04, "品　番　・　品　目", 0, 0, "C");
    $this->pdf->SetXY(119.25, 80.63);
    $this->pdf->Cell(21.22, 5.04, "数　量", 0, 0, "C");
    $this->pdf->SetXY(140.47, 80.63);
    $this->pdf->Cell(9.82, 5.04, "単位", 0, 0, "C");
    $this->pdf->SetXY(150.29, 80.63);
    $this->pdf->Cell(28.68, 5.04, "単　価", 0, 0, "C");
    $this->pdf->SetXY(178.97, 80.63);
    $this->pdf->Cell(23.74, 5.04, "御買上額", 0, 0, "C");

    $y = 85.67;
    for ($i = 0; $i < $this::PER_PAGE; $i++) {
      $this->pdf->lineW(9.54, $y, 193.17);
      $y = $y + 4.27;
    }

    $details = new Collection($data->get('details'));
    $rows = $details->forPage($page, $this::PER_PAGE);
    $y = 85.67;
    foreach ($rows as $row) {
      $row = new Collection($row);

      $this->pdf->SetFontSize(8);
      $this->pdf->SetXY(9.54, $y);
      $this->pdf->Cell(21.7, 5.04, $row->get('job_date'), 0, 0, "C");
      $this->pdf->SetXY(31.24, $y);
      $this->pdf->Cell(23.18, 5.04, $row->get('sales_id'), 0, 0, "R");
      $this->pdf->SetXY(54.42, $y);
      $this->pdf->Cell(64.83, 5.04, mb_strimwidth($row->get('item_name', ''), 0, 40));
      $this->pdf->SetXY(119.25, $y);
      $this->pdf->Cell(21.22, 5.04, $row->get('quantity'), 0, 0, "R");
      $this->pdf->SetXY(140.47, $y);
      $this->pdf->Cell(9.82, 5.04, "個", 0, 0, "C");

      $unit_price = $row->get('unit_price');
      if ($unit_price !== null) {
        $this->pdf->SetXY(150.29, $y);
        $this->pdf->Cell(28.68, 5.04, number_format($unit_price, 2), 0, 0, "R");
      }

      $detail_kind = $row->get('detail_kind');
      $amount = $row->get('amount');
      if ($amount !== null) {
        if ($detail_kind == 2) {
          $amount = $amount * -1;
        }
        $this->pdf->SetXY(178.97, $y);
        $this->pdf->Cell(23.74, 5.04, number_format($amount, 0), 0, 0, "R");
      }

      $y = $y + 4.27;
    }

    // 三つ折り線
    $this->writeTriFoldLine(99.6);
    $this->writeTriFoldLine(200);

    $this->pdf->lineW(6.5, 120, 3.04);
    $this->pdf->lineW(3.5, 150.5, 6.04);
  }

  /**
   * 三つ折り線を出力する
   *
   * @param mixed $height
   */
  private function writeTriFoldLine($height)
  {
    $top = $height - 1.2;
    $bottom = $height + 1.2;

    // 三つ折り線
    $this->pdf->Line(6.5, $top, 7.8, $height);
    $this->pdf->Line(6.5, $bottom, 7.8, $height);

    $this->pdf->Line(205.75, $top, 204.45, $height);
    $this->pdf->Line(205.75, $bottom, 204.45, $height);

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