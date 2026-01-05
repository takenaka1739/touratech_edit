<?php

namespace App\Api\Sales\Services;

use App\Base\Pdf\PdfWrapper;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\Log;

/**
 * 納品書 & 請求書PDFサービス
 */
class SalesPdfService
{
  // レイアウト上 1ページ9行の罫線を引いているため9に統一
  const PER_PAGE = 9;

  /** @var \App\Base\Pdf\PdfWrapper */
  protected $pdf;

  /** @var string */
  protected $base_path;

  /** @var string */
  protected $doc_type;

  /**
   * 控（上半分）/本紙（下半分）で割引印字状態を別管理
   * ※今は明細割引を行ごとに出すため、将来用として残置
   */
  protected bool $discountPrintedCopy1 = false; // 上：控
  protected bool $discountPrintedCopy2 = false; // 下：本紙

  // -----------------------------
  // 明細テーブル列レイアウト（請求書/納品書）
  // -----------------------------
  // 明細枠: rect(23, base_y+63, 177.38, 80.64)
  // 左端X=23、右端X=23+177.38=200.38
  private const X_TBL_L = 23.00;
  private const X_TBL_R = 200.38;

  /**
   * 縦線（列境界）
   * 品番・品名 | 数量 | 単位 | 掛率 | 単価 | 割引 | 金額 | 販売上代(税抜)
   *
   * ★調整方針
   * - 数量：狭める
   * - 単位：広げすぎを抑える
   */
  private const X_ITEM_R      = 85.85;   // 品番・品名 右端（既存）
  private const X_QTY_R       = 100.00;  // 数量 右端（狭める）
  private const X_UNIT_R      = 110.00;  // 単位 右端（広げすぎを抑える：幅約10）
  private const X_RATE_R      = 122.00;  // 掛率 右端
  private const X_UNITPRICE_R = 137.00;  // 単価 右端
  private const X_DISC_R      = 155.00;  // 割引 右端
  private const X_AMOUNT_R    = 177.94;  // 金額 右端（既存）

  // 行レイアウト
  private const ROW_Y0 = 68.70;  // 明細1行目の基準Y（base_y 加算前）
  private const ROW_H  = 8.65;   // 1行の高さ

  // 小計・値引を「最下段2行」に固定するための予約行数
  private const BOTTOM_FIXED_ROWS = 2;

  // ★摘要/合計開始線( base_y + 137.9 )と干渉させないため、最下段1行はガードとして空ける
  private const SUMMARY_GUARD_ROWS = 1;

  public function __construct()
  {
    $this->base_path = config('const.paths.sales.output_path');
  }

  public function getBasePath()
  {
    return $this->base_path;
  }

  /**
   * コントローラ互換メソッド（PDF生成）
   *
   * @param array $data
   * @param string $doc_type  '納品書' or '請求書'
   * @return string file_id
   */
  public function createPdf(array $data, $doc_type)
  {
    $this->doc_type = $doc_type;
    $this->pdf = new PdfWrapper($this->doc_type);
    $this->debugLogPdfPayload('createPdf', $data);


    // 状態初期化（控/本紙で別）
    $this->discountPrintedCopy1 = false;
    $this->discountPrintedCopy2 = false;

    $this->write($data);

    $prefix  = Carbon::now()->format('Ymd');
    $file_id = $this->getFileId($prefix);
    $path    = app_storage_path($this->getStoragePath($file_id));

    $this->pdf->Output($path, 'F');
    return $file_id;
  }

  public function getStoragePath(string $file_id)
  {
    if (strpos($file_id, '_') === false) {
      throw new Exception("Failed get path.");
    }

    [$ymd, $file_name] = explode('_', $file_id, 2);
    $path = $this->base_path . $ymd . DIRECTORY_SEPARATOR;

    Storage::makeDirectory($path);

    return $path . $file_name;
  }

  /**
   * 明細の「行index(0-8)」から、その行の基準Yを返す
   */
  private function rowY(int $base_y, int $rowIndex): float
  {
    return $base_y + self::ROW_Y0 + (self::ROW_H * $rowIndex);
  }

  /**
   * 最終ページで必要な「送料/代引」の行数
   */
  private function getShippingFeeRowCount(array $data): int
  {
    $d = new Collection($data);
    $cnt = 0;
    if ((float)$d->get('shipping_amount', 0) > 0) $cnt++;
    if ((float)$d->get('fee', 0) > 0)             $cnt++;
    return $cnt;
  }

  /**
   * 書き込む（全ページ制御）
   */
  protected function write(array $data)
  {
    $d = new Collection($data);

    $details = $d->get('details', []);
    if (!is_array($details)) {
      $details = (array)$details;
    }

    // ページ数計算用に「最終ページの追加行（送料/代引 + 小計/値引）」を行数として含める
    // ※SUMMARY_GUARD_ROWS は「描画しない保護行」なのでページ数計算には含めない（行が増えるとページングが変わるため）
    $extraRows = $this->getShippingFeeRowCount($data) + self::BOTTOM_FIXED_ROWS;

    $totalRows = count($details) + $extraRows;
    $totalRows = max(1, $totalRows);
    $max_page  = (int)ceil($totalRows / static::PER_PAGE);

    for ($i = 1; $i <= $max_page; $i++) {
      $this->writePage($data, $i, $max_page);
    }
  }

  /**
   * 1ページ描画
   */
  protected function writePage(array $data, int $page, int $max_page)
  {
    $this->pdf->addPage();

    $this->writeParts($this->doc_type . "（控）", 0, $data, $page, $max_page, 1);
    $this->writeParts($this->doc_type, 148.5, $data, $page, $max_page, 2);

    $this->pdf->lineW(10, 148.5, 10);
  }

  /**
   * ページの上半分/下半分を描画
   */
  protected function writeParts(
    string $title,
    int $base_y,
    array $data,
    int $page,
    int $max_page,
    int $copyNo
  )
  {
    $data = new Collection($data);
    $this->debugLogPdfPayload('writeParts copy=' . $copyNo, $data->toArray());
    $config = new Collection($data->get('config_data', []));
    $customer = new Collection($data->get('customer_data', []));

    // コピーごとに状態を分ける（将来用）
    if ($copyNo === 1) {
      $discountPrinted =& $this->discountPrintedCopy1;
    } else {
      $discountPrinted =& $this->discountPrintedCopy2;
    }

    // -----------------------------
    // 宛先（郵便番号・氏名・TEL/FAX）を確実に埋める
    // - 旧実装ではヘッダ直下に入っていたが、現行は customer_data 側に入るケースがあるため吸収
    // -----------------------------
  // 郵便番号（ship_to_* 優先、旧キーも保険で吸収）
  $zip = (string)($data->get('ship_to_zip_code', '') ?: $data->get('zip_code', ''));
  $this->pdf->SetFontSize(13);
  $this->pdf->Text(23, $base_y + 14.3, "〒" . $zip);

  // 宛先
  $toName = (string)($data->get('ship_to_name', '') ?: $data->get('name', ''));
  $this->pdf->SetFontSize(13);
  $this->pdf->Text(23, $base_y + 23.7, $toName . "　様");

  // TEL / FAX
  $tel = (string)($data->get('ship_to_tel', '') ?: $data->get('tel', ''));
  $fax = (string)($data->get('fax', '') ?: ''); // ship_to_fax は無い
  $this->pdf->SetFontSize(10);
  $this->pdf->Text(23, $base_y + 34.1, 'TEL ' . $tel);
  $this->pdf->Text(58.2, $base_y + 34.1, 'FAX ' . $fax);

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
    $this->pdf->Cell(25, 6.28, (string)$data->get('id', ''), 0, 0, 'R');
    $this->pdf->SetXY(175.23, $base_y + 9.49);
    $this->pdf->Cell(25, 6.28, (string)$data->get('user_name', ''), 0, 0, 'C');

    // 日付
    $yy = ""; $mm = ""; $dd = "";
    $date = $data->get('sales_date');
    if (!empty($date)) {
      $dt = new Carbon($date);
      $yy = $dt->year;
      $mm = $dt->month;
      $dd = $dt->day;
    }
    $this->pdf->SetFontSize(12);
    $this->pdf->TextRight(173.13, $base_y + 15.7, (string)$yy);
    $this->pdf->SetFontSize(9);
    $this->pdf->Text(173.191, $base_y + 16.821, '年');
    $this->pdf->SetFontSize(12);
    $this->pdf->TextRight(183.547, $base_y + 15.7, (string)$mm);
    $this->pdf->SetFontSize(9);
    $this->pdf->Text(184.303, $base_y + 16.821, '月');
    $this->pdf->SetFontSize(12);
    $this->pdf->TextRight(194.84, $base_y + 15.7, (string)$dd);
    $this->pdf->SetFontSize(9);
    $this->pdf->Text(195.128, $base_y + 16.821, '日');

    $this->pdf->Text(23, $base_y + 38.1, '支払方法：' . get_corporate_class_name($data->get('corporate_class', 1)));

    // 自社名
    $this->pdf->SetFontSize(12);
    $this->pdf->Text(117, $base_y + 22.7, (string)$config->get('company_name', ''));

    $this->pdf->SetFontSize(9);
    $this->pdf->Text(124, $base_y + 28, '〒 ' . (string)$config->get('zip_code', ''));
    $this->pdf->Text(124, $base_y + 32, (string)$config->get('address1', '') . (string)$config->get('address2', ''));
    $this->pdf->Text(124, $base_y + 36, 'TEL:' . (string)$config->get('tel', ''));
    $this->pdf->Text(162.85, $base_y + 36, 'FAX:' . (string)$config->get('fax', ''));

    $this->pdf->Text(124, $base_y + 40, '【振込先口座】');
    $bank_name      = (string)$config->get('bank_name1', '');
    $branch_name    = (string)$config->get('branch_name1', '');
    $account_type   = (string)$config->get('account_type1', '');
    $account_number = (string)$config->get('account_number1', '');
    if (intval($customer->get('bank_class', 1)) === 2) {
      $bank_name      = (string)$config->get('bank_name2', '');
      $branch_name    = (string)$config->get('branch_name2', '');
      $account_type   = (string)$config->get('account_type2', '');
      $account_number = (string)$config->get('account_number2', '');
    }
    $this->pdf->Text(124, $base_y + 44, $bank_name . $branch_name);
    $this->pdf->Text(159.78, $base_y + 44, $account_type);
    $this->pdf->Text(176.61, $base_y + 44, $account_number);

    $this->pdf->rect(155, $base_y + 49, 45, 12.8);
    $this->pdf->lineH(159, $base_y + 49, 12.8);
    $this->pdf->lineH(173, $base_y + 49, 12.8);
    $this->pdf->lineH(187, $base_y + 49, 12.8);
    $this->pdf->Text(154.5, $base_y + 51.5, "検");
    $this->pdf->Text(154.5, $base_y + 55.5, "印");

    $this->pdf->SetFontSize(8);
    $this->pdf->Text(23, $base_y + 54.6, "お客様コードNo." . (string)$data->get('user_id', ''));
    $this->pdf->Text(70, $base_y + 54.6, "注文番号:" . (string)$data->get('order_no', ''));

    $message = "毎度ありがとうございます。下記の通り納品致しましたのでご査収下さい。";
    if ($this->doc_type === "請求書") {
      $message = "毎度ありがとうございます。下記の通り御請求申し上げます。";
    }
    $this->pdf->SetFontSize(10);
    $this->pdf->Text(23, $base_y + 58.5, $message);

    // 明細枠
    $this->pdf->rect(23, $base_y + 63, 177.38, 80.64);

    // 縦線（列）
    $this->pdf->lineH(self::X_ITEM_R,      $base_y + 63, 74.9);
    $this->pdf->lineH(self::X_QTY_R,       $base_y + 63, 74.9);
    $this->pdf->lineH(self::X_UNIT_R,      $base_y + 63, 74.9);
    $this->pdf->lineH(self::X_RATE_R,      $base_y + 63, 74.9);
    $this->pdf->lineH(self::X_UNITPRICE_R, $base_y + 63, 74.9);
    $this->pdf->lineH(self::X_DISC_R,      $base_y + 63, 74.9);
    $this->pdf->lineH(self::X_AMOUNT_R,    $base_y + 63, 74.9);

    // 合計行の縦線（既存のまま）
    $this->pdf->lineH(105.69, $base_y + 137.9, 5.74);
    $this->pdf->lineH(111.30, $base_y + 137.9, 5.74);
    $this->pdf->lineH(142.19, $base_y + 137.9, 5.74);
    $this->pdf->lineH(169.58, $base_y + 137.9, 5.74);

    // ヘッダ
    $this->pdf->SetFontSize(8);

    $this->pdf->SetXY(self::X_TBL_L, $base_y + 63);
    $this->pdf->Cell(self::X_ITEM_R - self::X_TBL_L, 5.7, "品 番 ・ 品 名", 0, 0, 'C');

    $this->pdf->SetXY(self::X_ITEM_R, $base_y + 63);
    $this->pdf->Cell(self::X_QTY_R - self::X_ITEM_R, 5.7, "数　量", 0, 0, 'C');

    $this->pdf->SetXY(self::X_QTY_R, $base_y + 63);
    $this->pdf->Cell(self::X_UNIT_R - self::X_QTY_R, 5.7, "単 位", 0, 0, 'C');

    $this->pdf->SetXY(self::X_UNIT_R, $base_y + 63);
    $this->pdf->Cell(self::X_RATE_R - self::X_UNIT_R, 5.7, "掛 率", 0, 0, 'C');

    $this->pdf->SetXY(self::X_RATE_R, $base_y + 63);
    $this->pdf->Cell(self::X_UNITPRICE_R - self::X_RATE_R, 5.7, "単　価", 0, 0, 'C');

    $this->pdf->SetXY(self::X_UNITPRICE_R, $base_y + 63);
    $this->pdf->Cell(self::X_DISC_R - self::X_UNITPRICE_R, 5.7, "割　引", 0, 0, 'C');

    $this->pdf->SetXY(self::X_DISC_R, $base_y + 63);
    $this->pdf->Cell(self::X_AMOUNT_R - self::X_DISC_R, 5.7, "金　額", 0, 0, 'C');

    // ★見出しを「販売上代(税抜)」に戻す
    $this->pdf->SetXY(self::X_AMOUNT_R, $base_y + 63);
    $this->pdf->Cell(self::X_TBL_R - self::X_AMOUNT_R, 5.7, "販売上代(税抜)", 0, 0, 'C');

    // 行の横線
    $yLine = $base_y + self::ROW_Y0;
    for ($i = 0; $i < 9; $i++) {
      $this->pdf->lineW(23, $yLine, 177.38);
      $yLine += self::ROW_H;
    }

    // -----------------------------
    // 明細描画（ページング）
    // -----------------------------
    $details = new Collection($data->get('details', []));
    $rows = $details->forPage($page, static::PER_PAGE);
    if (config('app.debug')) {
      $first = $rows->first();
      Log::info('[SalesPdfService][DEBUG] first detail keys', [
        'exists' => (bool)$first,
        'keys'   => $first ? array_keys((array)$first) : [],
        'row'    => $first ? (array)$first : null,
      ]);
    }

    $isLastPage = ($page === $max_page);
    $shipFeeRows = $isLastPage ? $this->getShippingFeeRowCount($data->toArray()) : 0;

    // 最終ページは「下2行（小計/値引）を固定予約」し、さらに送料/代引行も予約して明細行数を制限
    // ★さらに摘要/合計開始線と干渉しないよう、最下段1行をガードとして空ける
    $maxDetailRowsThisPage = static::PER_PAGE;
    if ($isLastPage) {
      $maxDetailRowsThisPage = static::PER_PAGE
        - self::BOTTOM_FIXED_ROWS
        - self::SUMMARY_GUARD_ROWS
        - $shipFeeRows;

      if ($maxDetailRowsThisPage < 0) $maxDetailRowsThisPage = 0;
    }

    $rowIndex = 0;
    foreach ($rows as $row) {
      if ($rowIndex >= $maxDetailRowsThisPage) break;

      $row = new Collection($row);
      $y = $this->rowY($base_y, $rowIndex);

      // 商品名（jpが無ければ通常名）
      $itemName  = (string)($row->get('item_name_jp', '') ?? '');
      if ($itemName  === '') {
        $itemName  = (string)($row->get('item_name', '') ?? '');
      }

      // 掛率
      $rate = $row->get('rate', null);
      $rateText = ($rate === null || $rate === '') ? '' : ((string)$rate . '%');

      // 明細割引（将来：t_sale_details.discount）
      $detailDiscount = (float)$row->get('discount', 0);

      // 品番
      $this->pdf->SetFontSize(10);
      $this->pdf->SetXY(self::X_TBL_L, $y);
      $this->pdf->Cell(self::X_ITEM_R - self::X_TBL_L, 2.35, (string)$row->get('item_number', ''));

      // 商品名
      $this->pdf->SetFontSize(9);
      $this->pdf->SetXY(self::X_TBL_L, $y + 4.35);
      $this->pdf->Cell(self::X_ITEM_R - self::X_TBL_L, 4.35, mb_strimwidth($itemName , 0, 38));

      // 数量
      $this->pdf->SetFontSize(10);
      $this->pdf->SetXY(self::X_ITEM_R, $y + 3.85);
      $this->pdf->Cell(self::X_QTY_R - self::X_ITEM_R, 4.35, number_format((float)$row->get('quantity', 0), 0), 0, 0, "R");

      // 単位
      $unit = ((int)$row->get('item_kind', 1) === 2) ? "ｾｯﾄ" : "個";
      $this->pdf->SetXY(self::X_QTY_R, $y + 3.85);
      $this->pdf->Cell(self::X_UNIT_R - self::X_QTY_R, 4.35, $unit, 0, 0, "C");

      // 掛率
      $this->pdf->SetFontSize(9);
      $this->pdf->SetXY(self::X_UNIT_R, $y + 3.85);
      $this->pdf->Cell(self::X_RATE_R - self::X_UNIT_R, 4.35, $rateText, 0, 0, "C");

      // 単価（小数なし）
      $this->pdf->SetFontSize(10);
      $this->pdf->SetXY(self::X_RATE_R, $y + 3.85);
      $this->pdf->Cell(self::X_UNITPRICE_R - self::X_RATE_R, 4.35, number_format((float)$row->get('unit_price', 0), 0), 0, 0, "R");

      // 明細割引（小数なし）
      if ($detailDiscount != 0.0) {
        $this->pdf->SetXY(self::X_UNITPRICE_R, $y + 3.85);
        $this->pdf->Cell(self::X_DISC_R - self::X_UNITPRICE_R, 4.35, number_format($detailDiscount, 0), 0, 0, "R");
      }

      // 金額（小数なし）
      $this->pdf->SetFontSize(11);
      $this->pdf->SetXY(self::X_DISC_R, $y + 2.5);
      $this->pdf->Cell(self::X_AMOUNT_R - self::X_DISC_R, 5.7, number_format((float)$row->get('amount', 0), 0), 0, 0, "R");

      // 販売上代（元の中身：税込 + （税額））
      $this->pdf->SetFontSize(7);
      $this->pdf->SetXY(self::X_AMOUNT_R, $y + 0.5);
      $this->pdf->Cell(self::X_TBL_R - self::X_AMOUNT_R, 4.35, "税込", 0, 0, "L");

      $this->pdf->SetFontSize(7);
      $this->pdf->SetXY(self::X_AMOUNT_R, $y + 3.85);
      $this->pdf->Cell(self::X_TBL_R - self::X_AMOUNT_R, 4.35, '（' . number_format((float)$row->get('sales_tax', 0), 0) . '）', 0, 0, "R");

      $rowIndex++;
    }

    // -----------------------------
    // 最終ページ：送料/代引（下固定行の直上に積む）＋ 小計/値引（枠内で固定）
    // -----------------------------
    if ($isLastPage) {

      // ★小計・値引の固定行（摘要開始線と干渉しないよう、最下段(rowIndex=8)はガードとして空ける）
      $subtotalRowIndex = static::PER_PAGE - 3; // 6
      $discountRowIndex = static::PER_PAGE - 2; // 7

      $ySubtotal = $this->rowY($base_y, $subtotalRowIndex);
      $yDiscount = $this->rowY($base_y, $discountRowIndex);

      // 送料/代引は、明細の次の行から「小計行の直前」までに積む
      $shipping_amount = (float)$data->get('shipping_amount', 0);
      $fee             = (float)$data->get('fee', 0);

      $extraRowIndex = $rowIndex; // 明細の次の空き行
      $limitRowIndex = $subtotalRowIndex; // ここ未満までが送料/代引に使える

      if ($shipping_amount > 0 && $extraRowIndex < $limitRowIndex) {
        $y = $this->rowY($base_y, $extraRowIndex);

        $this->pdf->SetFontSize(9);
        $this->pdf->SetXY(self::X_TBL_L, $y + 4.35);
        $this->pdf->Cell(self::X_ITEM_R - self::X_TBL_L, 4.35, "送料");

        $this->pdf->SetFontSize(11);
        $this->pdf->SetXY(self::X_DISC_R, $y + 2.5);
        $this->pdf->Cell(self::X_AMOUNT_R - self::X_DISC_R, 5.7, number_format($shipping_amount, 0), 0, 0, "R");

        $extraRowIndex++;
      }

      if ($fee > 0 && $extraRowIndex < $limitRowIndex) {
        $y = $this->rowY($base_y, $extraRowIndex);

        $this->pdf->SetFontSize(9);
        $this->pdf->SetXY(self::X_TBL_L, $y + 4.35);
        $this->pdf->Cell(self::X_ITEM_R - self::X_TBL_L, 4.35, "代引手数料");

        $this->pdf->SetFontSize(11);
        $this->pdf->SetXY(self::X_DISC_R, $y + 2.5);
        $this->pdf->Cell(self::X_AMOUNT_R - self::X_DISC_R, 5.7, number_format($fee, 0), 0, 0, "R");

        $extraRowIndex++;
      }

      // 値引（t_sales.discount）
      $headerDiscount = (float)$data->get('discount', 0);

      // 小計：合計 + 値引（値引が合計から引かれている前提）
      $total_amount = (float)$data->get('total_amount', 0);
      $subtotal = $total_amount + $headerDiscount;

      // ★小計（固定）
      $this->pdf->SetFontSize(9);
      $this->pdf->SetXY(self::X_TBL_L, $ySubtotal + 4.35);
      $this->pdf->Cell(self::X_ITEM_R - self::X_TBL_L, 4.35, "小計");

      $this->pdf->SetFontSize(11);
      $this->pdf->SetXY(self::X_DISC_R, $ySubtotal + 2.5);
      $this->pdf->Cell(self::X_AMOUNT_R - self::X_DISC_R, 5.7, number_format($subtotal, 0), 0, 0, "R");

      // ★値引（固定）
      $this->pdf->SetFontSize(9);
      $this->pdf->SetXY(self::X_TBL_L, $yDiscount + 4.35);
      $this->pdf->Cell(self::X_ITEM_R - self::X_TBL_L, 4.35, "値引");

      $this->pdf->SetFontSize(11);
      $this->pdf->SetXY(self::X_DISC_R, $yDiscount + 2.5);

      // 表示は「▲」付き（正数の値引を想定）
      $discText = ($headerDiscount > 0) ? ('▲' . number_format($headerDiscount, 0)) : number_format($headerDiscount, 0);
      $this->pdf->Cell(self::X_AMOUNT_R - self::X_DISC_R, 5.7, $discText, 0, 0, "R");
    }

    // -----------------------------
    // 摘要（既存合わせ：空白運用）
    // -----------------------------
    $this->pdf->SetFontSize(9);
    $this->pdf->Text(23, $base_y + 137.9, "摘要：");
    // remarks は印字しない

    // -----------------------------
    // 合計欄（従来どおり）
    // -----------------------------
    $this->pdf->SetFontSize(7);
    $this->pdf->Text(106.7, $base_y + 138, "合");
    $this->pdf->Text(106.7, $base_y + 140.8, "計");
    $this->pdf->Text(111.30, $base_y + 137.9, "税抜");
    $this->pdf->Text(142.19, $base_y + 137.9, "税額");
    $this->pdf->Text(169.58, $base_y + 137.9, "総額");

    if ($page === $max_page) {

      $total_amount = (float)$data->get('total_amount', 0);
      $rate         = (int)$data->get('sales_tax_rate', 10);
      $fraction     = (int)$data->get('fraction', 3);
      $sales_tax    = get_sales_tax($total_amount, $rate, $fraction);

      $this->pdf->SetFontSize(9);
      $this->pdf->SetXY(111.30, $base_y + 139.5);
      $this->pdf->Cell(30.89, 4, number_format($total_amount - $sales_tax, 0), 0, 0, "R");
      $this->pdf->SetXY(142.19, $base_y + 139.5);
      $this->pdf->Cell(27.39, 4, number_format($sales_tax, 0), 0, 0, "R");

      $this->pdf->SetFontSize(12);
      $this->pdf->SetXY(169.58, $base_y + 138.4);
      $this->pdf->Cell(30.8, 5, number_format($total_amount, 0), 0, 0, "R");
    }

    unset($discountPrinted);
  }

  private function getFileId(string $prefix)
  {
    return $prefix . "_" . Str::random(32);
  }

  /**
   * Collection 配列の中から、指定キー群の「最初の非空値」を返す
   */
  private function pickFirstNonEmpty(array $sources, array $keys): string
  {
    foreach ($sources as $src) {
      if (!$src instanceof Collection) continue;

      foreach ($keys as $k) {
        if (!$src->has($k)) continue;

        $v = $src->get($k);

        if (is_string($v)) {
          $v = trim($v);
          if ($v !== '') return $v;
        } elseif (!is_null($v) && $v !== '') {
          return (string)$v;
        }
      }
    }
    return '';
  }

  private function debugLogPdfPayload(string $label, array $data): void
  {
      try {
          $mask = function ($v) {
              if (!is_string($v)) return $v;
              $v = trim($v);
              if ($v === '') return $v;

              // 電話っぽいものは末尾4桁以外マスク
              if (preg_match('/^\d[\d\-]{7,}$/', $v)) {
                  return preg_replace('/\d(?=\d{4})/', '*', $v);
              }

              // 文字列は長すぎるとログが荒れるので最大60文字
              $short = mb_substr($v, 0, 60);
              return $short . (mb_strlen($v) > 60 ? '…' : '');
          };

          // 主要キー候補（あなたのPDFが参照している/参照しがちなもの）
          $keys = [
              'id', 'sales_date', 'sales_at', 'order_no',
              'zip_code', 'name', 'tel', 'fax',
              'remarks',
              'customer_data', 'config_data',
          ];

          $pick = [];
          foreach ($keys as $k) {
              if (array_key_exists($k, $data)) {
                  $pick[$k] = $data[$k];
              }
          }

          // customer_data の中身も見たい
          $customer = $data['customer_data'] ?? null;
          if (is_array($customer)) {
              $pick['customer_data_keys'] = array_keys($customer);
              foreach (['name', 'zip_code', 'tel', 'fax', 'address1', 'address2', 'zipcode', 'phone'] as $k) {
                  if (array_key_exists($k, $customer)) {
                      $pick["customer_data.$k"] = $customer[$k];
                  }
              }
          } else {
              $pick['customer_data_type'] = gettype($customer);
          }

          // remarks は中身をマスクして短く
          if (isset($pick['remarks'])) {
              $pick['remarks'] = $mask((string)$pick['remarks']);
          }

          // zip/name/tel/fax はマスク
          foreach (['zip_code', 'name', 'tel', 'fax'] as $k) {
              if (isset($pick[$k])) $pick[$k] = $mask((string)$pick[$k]);
          }
          foreach (['customer_data.name', 'customer_data.zip_code', 'customer_data.tel', 'customer_data.fax', 'customer_data.phone', 'customer_data.zipcode'] as $k) {
              if (isset($pick[$k])) $pick[$k] = $mask((string)$pick[$k]);
          }

          // 上位キー一覧（どんな構造で来てるか把握用）
          $pick['top_keys'] = array_keys($data);

          Log::info('[SalesPdfService][DEBUG] ' . $label, $pick);
      } catch (\Throwable $e) {
          Log::warning('[SalesPdfService][DEBUG] failed to log payload: ' . $e->getMessage());
      }
  }
}
