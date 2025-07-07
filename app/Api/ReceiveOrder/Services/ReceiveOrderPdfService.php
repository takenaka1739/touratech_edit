<?php

namespace App\Api\ReceiveOrder\Services;

use App\Base\Pdf\PdfWrapper;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use Exception;

/**
 * 受注データPDFサービス
 */
class ReceiveOrderPdfService
{
  const PER_PAGE = 18;

  /** @var \App\Base\Pdf\PdfWrapper */
  protected $pdf;

  /** @var string */
  protected $base_path;

  public function __construct()
  {
    $this->base_path = config('const.paths.receive_order.output_path');
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
      $this->pdf = new PdfWrapper("ご注文承り書");

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
    $data = new Collection($data);
    $config = new Collection($data->get('config_data'));

    $this->pdf->addPage();

    // タイトル
    $this->pdf->SetFontSize(16);
    $this->pdf->SetXY(87.578, 10.583);
    $this->pdf->Cell(41.422, 7.171, "ご注文承り書", 0, 0, "", false, "", 4);

    $this->pdf->SetFontSize(10);
    $this->pdf->TextRight(192.723, 21.633, $page . '頁');

    $y = "";
    $m = "";
    $d = "";
    $date = $data->get('receive_order_date');
    if ($date) {
      $dt = new Carbon($date);
      $y = $dt->year;
      $m = $dt->month;
      $d = $dt->day;
    }
    $this->pdf->SetFontSize(12);
    $this->pdf->TextRight(166.13, 27.202, $y);
    $this->pdf->SetFontSize(9);
    $this->pdf->Text(166.191, 28.323, '年');
    $this->pdf->SetFontSize(12);
    $this->pdf->TextRight(176.547, 27.202, $m);
    $this->pdf->SetFontSize(9);
    $this->pdf->Text(177.303, 28.323, '月');
    $this->pdf->SetFontSize(12);
    $this->pdf->TextRight(187.84, 27.202, $d);
    $this->pdf->SetFontSize(9);
    $this->pdf->Text(188.128, 28.323, '日');

    // 見積No
    $this->pdf->SetFontSize(9);
    $this->pdf->Text(19.908, 36.433, '見積No.' . $data->get('estimate_id'));

    // 宛名
    $this->pdf->lineBold();
    $this->pdf->lineW(20.778, 53.193, 86.439);
    $this->pdf->lineW(20.778, 61.224, 86.439);

    $this->pdf->SetFontSize(16);
    $this->pdf->Text(21, 45, $data->get('name'));
    $this->pdf->Text(96, 46, "様");

    $this->pdf->SetFontSize(8);
    $this->pdf->Text(32.666, 62.41, "下記の通り御見積申し上げます。");

    $this->pdf->SetFontSize(9);
    $this->pdf->Text(20.901, 73.269, "納入期日：");
    $y = "";
    $m = "";
    $d = "";
    $date = $data->get('delivery_date');
    if ($date) {
      $dt = new Carbon($date);
      $y = $dt->year;
      $m = $dt->month;
      $d = $dt->day;
    }
    $this->pdf->TextRight(50.052, 73.269, $y);
    $this->pdf->Text(51.052, 73.269, "年");
    $this->pdf->TextRight(60.071, 73.269, $m);
    $this->pdf->Text(61.071, 73.269, "月");
    $this->pdf->TextRight(70.086, 73.269, $d);
    $this->pdf->Text(71.086, 73.269, "日");

    $this->pdf->Text(20.901, 77.523, "納入場所：");
    $this->pdf->Text(37, 77.523, $data->get('address1', "") . $data->get('address2', ""));

    $this->pdf->Text(20.901, 81.781, "取引方法：");
    $this->pdf->Text(37, 81.781, get_corporate_class_name($data->get('corporate_class')));

    $this->pdf->Text(20.901, 86.051, "有効期限：");
    $y = "";
    $m = "";
    $d = "";
    $date = $data->get('receive_order_date');
    if ($date) {
      $dt = new Carbon($date);
      $dt = $dt->addMonth();
      $y = $dt->year;
      $m = $dt->month;
      $d = $dt->day;
    }
    $this->pdf->TextRight(50.052, 86.051, $y);
    $this->pdf->Text(51.052, 86.051, "年");
    $this->pdf->TextRight(60.071, 86.051, $m);
    $this->pdf->Text(61.071, 86.051, "月");
    $this->pdf->TextRight(70.086, 86.051, $d);
    $this->pdf->Text(71.086, 86.051, "日");

    $this->pdf->lineBold();
    $this->pdf->rect(21.771, 96.413, 81.405, 12.764);
    $this->pdf->lineNormal();
    $this->pdf->lineH(50.915, 96.413, 12.764);

    // 合計金額
    $this->pdf->SetFontSize(11);
    $this->pdf->SetXY(24.373, 100.509);
    $this->pdf->Cell(23.054, 5.57, "合計金額", 0, 0, "", false, "", 4);
    $this->pdf->SetFontSize(16);
    $this->pdf->SetXY(50.915, 96.413);
    $this->pdf->Cell(51.5, 12.764, '￥' . number_format($data->get('total_amount'), 0), 0, 0, "R");

    // ロゴ
    $this->pdf->Image(resource_path('images/logo.gif'), 122.421, 36.433, 75);

    $this->pdf->SetFontSize(10);
    $this->pdf->Text(122.421, 55, "ツアラテックジャパン");

    // 自社情報
    $this->pdf->SetFontSize(9);
    $this->pdf->Text(122.421, 66.709, $config->get('zip_code'));
    $this->pdf->Text(122.421, 70.954, $config->get('address1'));
    $this->pdf->Text(122.421, 75.657, 'TEL:' . $config->get('tel') . '  FAX:' . $config->get('fax'));
    $this->pdf->Text(122.421, 80.36, '登録番号 ' . config('const.invoice_no'));

    // 口座
    $bank_name = $config->get('bank_name1', '');
    $branch_name = $config->get('branch_name1', '');
    $account_type = $config->get('account_type1', '');
    $account_number = $config->get('account_number1', '');
    $account_name = $config->get('account_name1');
    if ($data->get('customer_bank_class') == 2) {
      $bank_name = $config->get('bank_name2', '');
      $branch_name = $config->get('branch_name2', '');
      $account_type = $config->get('account_type2', '');
      $account_number = $config->get('account_number2', '');
      $account_name = $config->get('account_name2');
    }
    $this->pdf->Text(122.421, 92, '　　　振込口座：'.$bank_name.$branch_name);
    $this->pdf->Text(122.421, 96.5, '　　　　　　　　'.$account_type . '　' . $account_number);
    $this->pdf->Text(122.421, 101, '振込先口座名義：'.$account_name);
    $y = "";
    $m = "";
    $d = "";
    $date = $data->get('receive_order_date');
    if ($date) {
      $dt = new Carbon($date);
      $dt = $dt->addMonth();
      $y = $dt->year;
      $m = $dt->month;
      $d = $dt->day;
    }
    $this->pdf->Text(122.421, 105.5, '　　お支払期限：'.$y."/".$m."/".$d);

    $this->pdf->lineBold();
    $this->pdf->Rect(21.541, 115.505, 174.864, 168.092);
    $this->pdf->lineW(21.771, 121.941, 174.864);
    $this->pdf->lineW(21.771, 275.709, 174.864);

    $this->pdf->lineNormal();
    $this->pdf->lineH(94.135, 115.559, 168.057);
    $this->pdf->lineH(120.265, 115.559, 168.057);
    $this->pdf->lineH(130.317, 115.559, 168.057);
    $this->pdf->lineH(160.471, 115.559, 168.057);

    $this->pdf->SetFontSize(9);
    $this->pdf->SetXY(21.771, 116.559);
    $this->pdf->Cell(72.364, 6.436, "内　容　・　仕　様", 0, 0, "C");
    $this->pdf->SetXY(94.135, 116.559);
    $this->pdf->Cell(26.13, 6.436, "数　量", 0, 0, "C");
    $this->pdf->SetXY(120.265, 116.559);
    $this->pdf->Cell(10.052, 6.436, "単位", 0, 0, "C");
    $this->pdf->SetXY(130.317, 116.559);
    $this->pdf->Cell(30.1, 6.436, "単　価", 0, 0, "C");
    $this->pdf->SetXY(160.471, 116.559);
    $this->pdf->Cell(35.934, 6.436, "金　　額", 0, 0, "C");

    $h = 121.94;
    for ($i = 0; $i < 18; $i++) {
        $h = $h + 8.545;
        $this->pdf->lineW(21.771, $h, 174.864);
    }

    $details = $data->get('details');
    $details = new Collection($details);
    $rows = $details->forPage($page, $this::PER_PAGE);
    $y = 113.395;
    foreach ($rows as $row) {
      $row = new Collection($row);

      $y = $y + 8.545;

      // 内容・仕様　上
      $this->pdf->SetFontSize(8);
      $this->pdf->SetXY(57.953, $y);
      $this->pdf->Cell(36.182, 4.5, $row->get('item_number'));

      // 内容・仕様　下
      $this->pdf->SetFontSize(10);
      $this->pdf->SetXY(21.771, $y + 3);
      $this->pdf->Cell(72.364, 5.545, mb_strimwidth($row->get('item_name_jp', ''), 0, 40));

      // 数量
      $this->pdf->SetFontSize(9);
      $this->pdf->SetXY(94.135, $y + 3);
      $this->pdf->Cell(26.13, 5.545, number_format($row->get('quantity', 0)), 0, 0, "R");

      // 単位
      $unit = "個";
      if ($row->get('item_kind') == 2) {
        $unit = "ｾｯﾄ";
      }
      $this->pdf->SetXY(120.265, $y + 2);
      $this->pdf->Cell(10.052, 6.545, $unit, 0, 0, "C");

      // 単価
      $this->pdf->SetXY(130.317, $y + 2);
      $this->pdf->Cell(30.1, 6.545, number_format($row->get('unit_price'), 2), 0, 0, "R");

      // 金額　上
      $this->pdf->SetXY(160.471, $y);
      $this->pdf->Cell(35.934, 4.5, $row->get('amount', 0) - $row->get('sales_tax', 0), 0, 0, "R");

      // 金額　下
      $this->pdf->SetFontSize(13);
      $total_amount = $row->get('amount', 0);
      $this->pdf->SetXY(160.471, $y + 2.6);
      $this->pdf->Cell(25, 5.945, number_format($total_amount), 0, 0, "R");
    }

    if ($page === $max_page) {

      $shipping_amount = $data->get('shipping_amount', 0);
      if ($shipping_amount > 0) {
        // 送料
        $y = $y + 8.545;

        $this->pdf->SetFontSize(10);
        $this->pdf->SetXY(21.771, $y + 3);
        $this->pdf->Cell(72.364, 5.545, "送料");

        $this->pdf->SetFontSize(13);
        $this->pdf->SetXY(160.471, $y + 2.6);
        $this->pdf->Cell(25, 5.945, number_format($shipping_amount, 2), 0, 0, "R");
      }

      $fee = $data->get('fee', 0);
      if ($fee > 0) {
        // 代引手数料
        $y = $y + 8.545;

        $this->pdf->SetFontSize(10);
        $this->pdf->SetXY(21.771, $y + 3);
        $this->pdf->Cell(72.364, 5.545, "代引手数料");

        $this->pdf->SetFontSize(13);
        $this->pdf->SetXY(160.471, $y + 2.6);
        $this->pdf->Cell(25, 5.945, number_format($fee, 2), 0, 0, "R");
      }

      $discount = $data->get('discount', 0);
      if ($discount > 0) {
        // 値引
        $y = $y + 8.545;

        $this->pdf->SetFontSize(10);
        $this->pdf->SetXY(21.771, $y + 3);
        $this->pdf->Cell(72.364, 5.545, "値引");

        $this->pdf->SetFontSize(13);
        $this->pdf->SetXY(160.471, $y + 2.6);
        $this->pdf->Cell(25, 5.945, number_format($discount, 2), 0, 0, "R");
      }

      $this->pdf->SetFontSize(10);
      $this->pdf->SetXY(21.771, 275.709);
      $this->pdf->Cell(72.364, 8.545, "合　　　　計", 0, 0, "C");

      $this->pdf->SetFontSize(13);
      $this->pdf->SetXY(160.471, 275.709 + 2);
      $this->pdf->Cell(35.934, 5.945, number_format($data->get('total_amount'), 0), 0, 0, "R");
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