<?php

namespace App\Api\Sales\Services;

use App\Base\Pdf\PdfWrapper;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use Exception;

/**
 * 納品書 & 請求書PDFサービス
 */
class SalesPdfService
{
  const PER_PAGE = 8;

  /** @var \App\Base\Pdf\PdfWrapper */
  protected $pdf;

  /** @var string */
  protected $base_path;

  /** @var string */
  protected $doc_type;

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
   * PDFを作成する
   *
   * @param array $cond 条件
   * @return string
   */
  public function createPdf(array $data, $doc_type)
  {
    $this->doc_type = $doc_type;
    $this->pdf = new PdfWrapper($this->doc_type);

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
    $d = new Collection($data);
    $details = $d->get('details');

    $count = count($details);
    if ($d->get('shipping_amount', 0) > 0) {
      $count++;
    }
    if ($d->get('fee', 0) > 0) {
      $count++;
    }
    if ($d->get('discount', 0) > 0) {
      $count++;
    }
    $max_page = Ceil($count / $this::PER_PAGE);

    for ($i = 1; $i <= $max_page; $i++) {
      $this->writePage($data, $i, $max_page);
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

    $this->writeParts($this->doc_type . "（控）", 0, $data, $page, $max_page);
    $this->writeParts($this->doc_type, 148.5, $data, $page, $max_page);

    $this->pdf->lineW(10, 148.5, 10);
  }

  protected function writeParts(
    string $title,
    int $base_y,
    array $data,
    int $page,
    int $max_page)
  {
    $data = new Collection($data);
    $config = new Collection($data->get('config_data'));
    $customer = new Collection($data->get('customer_data'));

    // タイトル
    $this->pdf->SetFontSize(18);
    $this->pdf->SetXY(85, $base_y + 7);
    $this->pdf->Cell(40, 7, $title, 0, 0, "C", false, '', 3);

    // 伝票番号・担当
    $this->pdf->rect(150.23, $base_y + 5.47, 50, 10.30);
    $this->pdf->lineW(150.23, $base_y + 9.49, 50);
    $this->pdf->lineH(175.23, $base_y + 5.47, 10.30);
    $this->pdf->SetFontSize(8);
    $this->pdf->SetXY(150.23, $base_y + 5.47);
    $this->pdf->Cell(25, 4.02, "伝 票 番 号", 0, 0, 'C');
    $this->pdf->SetXY(175.23, $base_y + 5.47);
    $this->pdf->Cell(25, 4.02, "担　当", 0, 0, 'C');

    $this->pdf->SetFontSize(12);
    $this->pdf->SetXY(150.23, $base_y + 9.49);
    $this->pdf->Cell(25, 6.28, $data->get('id'), 0, 0, 'R');
    $this->pdf->SetXY(175.23, $base_y + 9.49);
    $this->pdf->Cell(25, 6.28, $data->get('user_name'), 0, 0, 'C');

    // 日付
    $y = "";
    $m = "";
    $d = "";
    $date = $data->get('sales_date');
    if ($date) {
      $dt = new Carbon($date);
      $y = $dt->year;
      $m = $dt->month;
      $d = $dt->day;
    }
    $this->pdf->SetFontSize(12);
    $this->pdf->TextRight(173.13, $base_y + 15.7, $y);
    $this->pdf->SetFontSize(9);
    $this->pdf->Text(173.191, $base_y + 16.821, '年');
    $this->pdf->SetFontSize(12);
    $this->pdf->TextRight(183.547, $base_y + 15.7, $m);
    $this->pdf->SetFontSize(9);
    $this->pdf->Text(184.303, $base_y + 16.821, '月');
    $this->pdf->SetFontSize(12);
    $this->pdf->TextRight(194.84, $base_y + 15.7, $d);
    $this->pdf->SetFontSize(9);
    $this->pdf->Text(195.128, $base_y + 16.821, '日');

    // 郵便番号
    $this->pdf->SetFontSize(13);
    $this->pdf->Text(23, $base_y + 14.3, "〒" . $data->get('zip_code', ""));

    // 宛先
    $this->pdf->SetFontSize(13);
    $this->pdf->Text(23, $base_y + 23.7, $data->get('name') . "　様");

    $this->pdf->SetFontSize(10);
    $this->pdf->Text(23, $base_y + 34.1, 'TEL ' . $data->get('tel'));
    $this->pdf->Text(58.2, $base_y + 34.1, 'FAX ' . $data->get('fax'));
    $this->pdf->Text(23, $base_y + 38.1, '支払方法：' . get_corporate_class_name($data->get('corporate_class')));

    // 自社名
    $this->pdf->SetFontSize(12);
    $this->pdf->Text(117, $base_y + 22.7, $config->get('company_name'));

    $this->pdf->SetFontSize(9);
    $this->pdf->Text(124, $base_y + 28, '〒 ' . $config->get('zip_code', ''));
    $this->pdf->Text(124, $base_y + 32, $config->get('address1', '').$config->get('address2'));
    $this->pdf->Text(124, $base_y + 36, 'TEL:'.$config->get('tel', ''));
    $this->pdf->Text(162.85, $base_y + 36, 'FAX:'.$config->get('fax', ''));

    $this->pdf->Text(124, $base_y + 40, '【振込先口座】');
    $bank_name = $config->get('bank_name1', '');
    $branch_name = $config->get('branch_name1', '');
    $account_type = $config->get('account_type1', '');
    $account_number = $config->get('account_number1', '');
    if ($customer->get('bank_class') == 2) {
      $bank_name = $config->get('bank_name2', '');
      $branch_name = $config->get('branch_name2', '');
      $account_type = $config->get('account_type2', '');
      $account_number = $config->get('account_number2', '');
    }
    $this->pdf->Text(124, $base_y + 44, $bank_name.$branch_name);
    $this->pdf->Text(159.78, $base_y + 44, $account_type);
    $this->pdf->Text(176.61, $base_y + 44, $account_number);

    $this->pdf->rect(155, $base_y + 49, 45, 12.8);
    $this->pdf->lineH(159, $base_y + 49, 12.8);
    $this->pdf->lineH(173, $base_y + 49, 12.8);
    $this->pdf->lineH(187, $base_y + 49, 12.8);
    $this->pdf->Text(154.5, $base_y + 51.5, "検");
    $this->pdf->Text(154.5, $base_y + 55.5, "印");

    $this->pdf->SetFontSize(8);
    $this->pdf->Text(23, $base_y + 54.6, "お客様コードNo.". $data->get('user_id', ''));
    $this->pdf->Text(70, $base_y + 54.6, "注文番号:". $data->get('order_no', ''));

    $message = "毎度ありがとうございます。下記の通り納品致しましたのでご査収下さい。";
    if ($this->doc_type == "請求書") {
      $message = "毎度ありがとうございます。下記の通り御請求申し上げます。";
    }
    $this->pdf->SetFontSize(10);
    $this->pdf->Text(23, $base_y + 58.5, $message);

    $this->pdf->rect(23, $base_y + 63, 177.38, 80.64);
    $this->pdf->lineH(85.85, $base_y + 63, 74.9);
    $this->pdf->lineH(113.25, $base_y + 63, 74.9);
    $this->pdf->lineH(123, $base_y + 63, 74.9);
    $this->pdf->lineH(150, $base_y + 63, 74.9);
    $this->pdf->lineH(177.94, $base_y + 63, 74.9);

    $this->pdf->lineH(105.69, $base_y + 137.9, 5.74);
    $this->pdf->lineH(111.30, $base_y + 137.9, 5.74);
    $this->pdf->lineH(142.19, $base_y + 137.9, 5.74);
    $this->pdf->lineH(169.58, $base_y + 137.9, 5.74);

    $this->pdf->SetFontSize(8);
    $this->pdf->SetXY(23, $base_y + 63);
    $this->pdf->Cell(62.85, 5.7, "品 番 ・ 品 名", 0, 0, 'C');
    $this->pdf->SetXY(85.85, $base_y + 63);
    $this->pdf->Cell(27.4, 5.7, "数　量", 0, 0, 'C');
    $this->pdf->SetXY(113.25, $base_y + 63);
    $this->pdf->Cell(9.75, 5.7, "単 位", 0, 0, 'C');
    $this->pdf->SetXY(123, $base_y + 63);
    $this->pdf->Cell(27, 5.7, "単　価", 0, 0, 'C');
    $this->pdf->SetXY(150, $base_y + 63);
    $this->pdf->Cell(27.94, 5.7, "金　額", 0, 0, 'C');
    $this->pdf->SetXY(177.94, $base_y + 63);
    $this->pdf->Cell(22.44, 5.7, "販売上代(税抜", 0, 0, 'C');

    $y = $base_y + 68.70;
    for ($i = 0; $i < 9; $i++) {
      $this->pdf->lineW(23, $y, 177.38);
      $y = $y + 8.65;
    }

    $details = $data->get('details');
    $details = new Collection($details);
    $rows = $details->forPage($page, $this::PER_PAGE);
    $y = $base_y + 68.70;
    foreach ($rows as $row) {
      $row = new Collection($row);

      // 品番・品名　上
      $this->pdf->SetFontSize(10);
      $this->pdf->SetXY(23, $y);
      $this->pdf->Cell(62.85, 2.35, $row->get('item_number'));

      // 品番・品名　下
      $this->pdf->SetFontSize(9);
      $this->pdf->SetXY(23, $y + 4.35);
      $this->pdf->Cell(62.85, 4.35, mb_strimwidth($row->get('item_name_jp', ''), 0, 38));

      // 数量
      $this->pdf->SetFontSize(10);
      $this->pdf->SetXY(85.85, $y + 3.85);
      $this->pdf->Cell(27.4, 4.35, number_format($row->get('quantity', 0)), 0, 0, "R");

      // 単位
      $unit = "個";
      if ($row->get('item_kind') == 2) {
        $unit = "ｾｯﾄ";
      }
      $this->pdf->SetXY(113.25, $y + 3.85);
      $this->pdf->Cell(9.75, 4.35, $unit, 0, 0, "C");

      // 単価
      $this->pdf->SetXY(123, $y + 3.85);
      $this->pdf->Cell(27, 4.35, number_format($row->get('unit_price'), 2), 0, 0, "R");

      // 金額
      $this->pdf->SetFontSize(11);
      $this->pdf->SetXY(150, $y + 2.5);
      $this->pdf->Cell(27.94, 5.7, number_format($row->get('amount'), 0), 0, 0, "R");

      // 販売上代
      $this->pdf->SetFontSize(7);
      $this->pdf->SetXY(177.94, $y + 0.5);
      $this->pdf->Cell(22.44, 4.35, "税込");

      $this->pdf->SetFontSize(7);
      $this->pdf->SetXY(177.94, $y + 3.85);
      $this->pdf->Cell(22.44, 4.35, '（'.number_format($row->get('sales_tax'), 0).'）', 0, 0, "R");

      $y = $y + 8.65;
    }

    if ($page === $max_page) {

      $shipping_amount = floatval($data->get('shipping_amount', 0));
      if ($shipping_amount > 0) {
        // 送料
        $this->pdf->SetFontSize(9);
        $this->pdf->SetXY(23, $y + 4.35);
        $this->pdf->Cell(62.85, 4.35, "送料");
  
        $this->pdf->SetFontSize(11);
        $this->pdf->SetXY(150, $y + 2.5);
        $this->pdf->Cell(27.94, 5.7, number_format($shipping_amount, 2), 0, 0, "R");

        $y = $y + 8.65;
      }

      $fee = floatval($data->get('fee', 0));
      if ($fee) {
        // 代引手数料
        $this->pdf->SetFontSize(9);
        $this->pdf->SetXY(23, $y + 4.35);
        $this->pdf->Cell(62.85, 4.35, "代引手数料");
  
        $this->pdf->SetFontSize(11);
        $this->pdf->SetXY(150, $y + 2.5);
        $this->pdf->Cell(27.94, 5.7, number_format($fee, 2), 0, 0, "R");

        $y = $y + 8.65;
      }

      $discount = floatval($data->get('discount', 0));
      if ($discount) {
        // 値引
        $this->pdf->SetFontSize(9);
        $this->pdf->SetXY(23, $y + 4.35);
        $this->pdf->Cell(62.85, 4.35, "値引");
  
        $this->pdf->SetFontSize(11);
        $this->pdf->SetXY(150, $y + 2.5);
        $this->pdf->Cell(27.94, 5.7, number_format($discount, 2), 0, 0, "R");

        $y = $y + 8.65;
      }
    }

    $this->pdf->SetFontSize(9);
    $this->pdf->Text(23, $base_y + 137.9, "摘要：");

    $this->pdf->SetFontSize(7);
    $this->pdf->Text(106.7, $base_y + 138, "合");
    $this->pdf->Text(106.7, $base_y + 140.8, "計");
    $this->pdf->Text(111.30, $base_y + 137.9, "税抜");
    $this->pdf->Text(142.19, $base_y + 137.9, "税額");
    $this->pdf->Text(169.58, $base_y + 137.9, "総額");

    if ($page === $max_page) {

      $total_amount = $data->get('total_amount');
      $rate = $data->get('sales_tax_rate');
      $fraction = $data->get('fraction');
      $sales_tax = get_sales_tax($total_amount, $rate, $fraction);

      $this->pdf->SetFontSize(9);
      $this->pdf->SetXY(111.30, $base_y + 139.5);
      $this->pdf->Cell(30.89, 4, number_format($total_amount - $sales_tax, 0), 0, 0, "R");
      $this->pdf->SetXY(142.19, $base_y + 139.5);
      $this->pdf->Cell(27.39, 4, number_format($sales_tax, 0), 0, 0, "R");

      $this->pdf->SetFontSize(12);
      $this->pdf->SetXY(169.58, $base_y + 138.4);
      $this->pdf->Cell(30.8, 5, number_format($total_amount, 0), 0, 0, "R");
    }
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