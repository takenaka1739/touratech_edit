<?php

namespace App\Api\ReceiveOrder\Services;

use App\Base\Pdf\PdfWrapper;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use Exception;

/**
 * 受注データPDFサービス（ご注文承り書）
 */
class ReceiveOrderPdfService
{
    const PER_PAGE = 18;

    /** @var \App\Base\Pdf\PdfWrapper */
    protected $pdf;

    /** @var string */
    protected $base_path;

    protected bool $discountPrinted = false;

    /** 明細枠内の固定値 */
    private const TABLE_TOP_Y = 115.559;
    private const TABLE_BOTTOM_Y = 275.709;
    private const ROW_HEIGHT = 8.545;
    private const ROW_BASE_Y = 113.395;

    /** 明細枠の下3行に固定で出す集計行数（小計/値引/合計） */
    private const SUMMARY_ROWS = 3;

    private const X_CONTENT_L = 21.771;
    private const X_CONTENT_R = 86.000;

    private const X_QTY_L = 86.000;
    private const X_QTY_R = 112.000;

    private const X_UNIT_L = 112.000;
    private const X_UNIT_R = 122.000;

    private const X_LIST_L = 122.000; // 定価
    private const X_LIST_R = 136.000;

    private const X_RATE_L = 136.000; // 掛率
    private const X_RATE_R = 145.000;

    private const X_UNITPRICE_L = 145.000; // 単価
    private const X_UNITPRICE_R = 160.000;

    private const X_DISCOUNT_L = 160.000; // 割引
    private const X_DISCOUNT_R = 172.000;

    private const X_AMOUNT_L = 172.000; // 金額
    private const X_AMOUNT_R = 196.635;

    public function __construct()
    {
        $this->base_path = config('const.paths.receive_order.output_path');
    }

    public function getBasePath()
    {
        return $this->base_path;
    }

    public function createPdf(array $data)
    {
        $this->pdf = new PdfWrapper("ご注文承り書");
        $this->discountPrinted = false;

        $this->write($data);

        $prefix  = Carbon::now()->format('Ymd');
        $file_id = $this->getFileId($prefix);
        $path    = app_storage_path($this->getStoragePath($file_id));

        $this->pdf->Output($path, 'F');
        return $file_id;
    }

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

    protected function write(array $data)
    {
        $d       = new Collection($data);
        $details = $d->get('details', []);
        if (!is_array($details)) {
            $details = (array) $details;
        }

        $extraRows = 0;
        if ((float)$d->get('shipping_amount', 0) > 0) $extraRows++;
        if ((float)$d->get('additional_shipping_amount', 0) > 0) $extraRows++;
        if ((float)$d->get('fee', 0) > 0)             $extraRows++;

        $totalRows = count($details) + $extraRows + self::SUMMARY_ROWS;
        $totalRows = max(1, $totalRows);
        $max_page  = (int) ceil($totalRows / self::PER_PAGE);

        for ($i = 1; $i <= $max_page; $i++) {
            $this->writePage($data, $i, $max_page);
        }
    }

    protected function writePage(array $data, int $page, int $max_page)
    {
        $data   = new Collection($data);
        $config = new Collection($data->get('config_data'));

        $this->pdf->addPage();

        // タイトル
        $this->pdf->SetFontSize(16);
        $this->pdf->SetXY(87.578, 10.583);
        $this->pdf->Cell(41.422, 7.171, "ご注文承り書", 0, 0, "", false, "", 4);

        $this->pdf->SetFontSize(10);
        $this->pdf->TextRight(192.723, 21.633, $page . '頁');

        // 日付
        $y    = "";
        $m    = "";
        $d    = "";
        $date = $data->get('receive_order_date');
        if ($date) {
            $dt = new Carbon($date);
            $y  = $dt->year;
            $m  = $dt->month;
            $d  = $dt->day;
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

        // 納入期日
        $this->pdf->SetFontSize(9);
        $this->pdf->Text(20.901, 73.269, "納入期日：");
        $y    = "";
        $m    = "";
        $d    = "";
        $date = $data->get('delivery_date');
        if ($date) {
            $dt = new Carbon($date);
            $y  = $dt->year;
            $m  = $dt->month;
            $d  = $dt->day;
        }
        $this->pdf->TextRight(50.052, 73.269, $y);
        $this->pdf->Text(51.052, 73.269, "年");
        $this->pdf->TextRight(60.071, 73.269, $m);
        $this->pdf->Text(61.071, 73.269, "月");
        $this->pdf->TextRight(70.086, 73.269, $d);
        $this->pdf->Text(71.086, 73.269, "日");

        // 納入場所・取引方法・有効期限
        $this->pdf->Text(20.901, 77.523, "納入場所：");
        $this->pdf->Text(37, 77.523, $data->get('address1', "") . $data->get('address2', ""));

        $this->pdf->Text(20.901, 81.781, "取引方法：");
        $this->pdf->Text(37, 81.781, get_corporate_class_name($data->get('corporate_class')));

        $this->pdf->Text(20.901, 86.051, "有効期限：");
        $y    = "";
        $m    = "";
        $d    = "";
        $date = $data->get('receive_order_date');
        if ($date) {
            $dt = new Carbon($date);
            $dt = $dt->addMonth();
            $y  = $dt->year;
            $m  = $dt->month;
            $d  = $dt->day;
        }
        $this->pdf->TextRight(50.052, 86.051, $y);
        $this->pdf->Text(51.052, 86.051, "年");
        $this->pdf->TextRight(60.071, 86.051, $m);
        $this->pdf->Text(61.071, 86.051, "月");
        $this->pdf->TextRight(70.086, 86.051, $d);
        $this->pdf->Text(71.086, 86.051, "日");

        // 合計金額（ヘッダ）
        $this->pdf->lineBold();
        $this->pdf->rect(21.771, 96.413, 81.405, 12.764);
        $this->pdf->lineNormal();
        $this->pdf->lineH(50.915, 96.413, 12.764);

        $this->pdf->SetFontSize(11);
        $this->pdf->SetXY(24.373, 100.509);
        $this->pdf->Cell(23.054, 5.57, "合計金額", 0, 0, "", false, "", 4);
        $pdfTotals = $this->calculatePdfTotals($data);
        $this->pdf->SetFontSize(16);
        $this->pdf->SetXY(50.915, 96.413);
        $this->pdf->Cell(51.5, 12.764, '￥' . number_format($pdfTotals['total'], 0), 0, 0, "R");

        // ロゴ・自社情報
        $this->pdf->Image(resource_path('images/logo.gif'), 122.421, 36.433, 75);
        $this->pdf->SetFontSize(10);
        $this->pdf->Text(122.421, 55, "ツアラテックジャパン");
        $this->pdf->SetFontSize(9);
        $this->pdf->Text(122.421, 66.709, $config->get('zip_code'));
        $this->pdf->Text(122.421, 70.954, $config->get('address1'));
        $this->pdf->Text(122.421, 75.657, 'TEL:' . $config->get('tel') . '  FAX:' . $config->get('fax'));
        $this->pdf->Text(122.421, 80.36, '登録番号 ' . config('const.invoice_no'));
        $this->pdf->Text(122.421, 85.063, '担当者：' . (string)$data->get('user_name', ''));

        if ((int)$data->get('corporate_class') === 4) {
            // 口座
            $bank_name      = $config->get('bank_name1', '');
            $branch_name    = $config->get('branch_name1', '');
            $account_type   = $config->get('account_type1', '');
            $account_number = $config->get('account_number1', '');
            $account_name   = $config->get('account_name1');
            if ($data->get('customer_bank_class') == 2) {
                $bank_name      = $config->get('bank_name2', '');
                $branch_name    = $config->get('branch_name2', '');
                $account_type   = $config->get('account_type2', '');
                $account_number = $config->get('account_number2', '');
                $account_name   = $config->get('account_name2');
            }
            $this->pdf->Text(122.421, 92, '　　　振込口座：' . $bank_name . $branch_name);
            $this->pdf->Text(122.421, 96.5, '　　　　　　　　' . $account_type . '　' . $account_number);
            $this->pdf->Text(122.421, 101, '振込先口座名義：' . $account_name);
            $y    = "";
            $m    = "";
            $d    = "";
            $date = $data->get('receive_order_date');
            if ($date) {
                $dt = new Carbon($date);
                $dt = $dt->addMonth();
                $y  = $dt->year;
                $m  = $dt->month;
                $d  = $dt->day;
            }
            $this->pdf->Text(122.421, 105.5, '　　お支払期限：' . $y . "/" . $m . "/" . $d);
        }

        // 明細の外枠
        $this->pdf->lineBold();
        $this->pdf->Rect(21.541, 115.505, 174.864, 168.092);
        $this->pdf->lineW(21.771, 121.941, 174.864);
        $this->pdf->lineW(21.771, 275.709, 174.864);

        // 明細部の縦線（新レイアウト）
        $this->pdf->lineNormal();
        $detailHeight = self::TABLE_BOTTOM_Y - self::TABLE_TOP_Y;

        $this->pdf->lineH(self::X_CONTENT_R,   self::TABLE_TOP_Y, $detailHeight); // 内容|数量
        $this->pdf->lineH(self::X_QTY_R,       self::TABLE_TOP_Y, $detailHeight); // 数量|単位
        $this->pdf->lineH(self::X_UNIT_R,      self::TABLE_TOP_Y, $detailHeight); // 単位|定価
        $this->pdf->lineH(self::X_LIST_R,      self::TABLE_TOP_Y, $detailHeight); // 定価|掛率
        $this->pdf->lineH(self::X_RATE_R,      self::TABLE_TOP_Y, $detailHeight); // 掛率|単価
        $this->pdf->lineH(self::X_UNITPRICE_R, self::TABLE_TOP_Y, $detailHeight); // 単価|割引
        $this->pdf->lineH(self::X_DISCOUNT_R,  self::TABLE_TOP_Y, $detailHeight); // 割引|金額

        // ヘッダ（新レイアウト）
        $this->pdf->SetFontSize(9);

        $this->pdf->SetXY(self::X_CONTENT_L, 116.559);
        $this->pdf->Cell(self::X_CONTENT_R - self::X_CONTENT_L, 6.436, "内　容　・　仕　様", 0, 0, "C");

        $this->pdf->SetXY(self::X_QTY_L, 116.559);
        $this->pdf->Cell(self::X_QTY_R - self::X_QTY_L, 6.436, "数　量", 0, 0, "C");

        $this->pdf->SetXY(self::X_UNIT_L, 116.559);
        $this->pdf->Cell(self::X_UNIT_R - self::X_UNIT_L, 6.436, "単位", 0, 0, "C");

        $this->pdf->SetXY(self::X_LIST_L, 116.559);
        $this->pdf->Cell(self::X_LIST_R - self::X_LIST_L, 6.436, "定価", 0, 0, "C");

        $this->pdf->SetXY(self::X_RATE_L, 116.559);
        $this->pdf->Cell(self::X_RATE_R - self::X_RATE_L, 6.436, "掛率", 0, 0, "C");

        $this->pdf->SetXY(self::X_UNITPRICE_L, 116.559);
        $this->pdf->Cell(self::X_UNITPRICE_R - self::X_UNITPRICE_L, 6.436, "単価", 0, 0, "C");

        $this->pdf->SetXY(self::X_DISCOUNT_L, 116.559);
        $this->pdf->Cell(self::X_DISCOUNT_R - self::X_DISCOUNT_L, 6.436, "割引", 0, 0, "C");

        $this->pdf->SetXY(self::X_AMOUNT_L, 116.559);
        $this->pdf->Cell(self::X_AMOUNT_R - self::X_AMOUNT_L, 6.436, "金額", 0, 0, "C");

        // 行ごとの横線
        $h = 121.94;
        for ($i = 0; $i < self::PER_PAGE; $i++) {
            $h = $h + self::ROW_HEIGHT;
            if ($h >= self::TABLE_BOTTOM_Y) {
                break;
            }
            $this->pdf->lineW(21.771, $h, 174.864);
        }

        // 明細行
        $details = new Collection($data->get('details', []));
        $rows    = $details->forPage($page, self::PER_PAGE);
        $yRowTop = self::ROW_BASE_Y;

        foreach ($rows as $row) {
            $row = new Collection($row);
            $yRowTop += self::ROW_HEIGHT;

            // 金額・税
            $rowAmount = (float) $row->get('amount', 0);
            $rowTax    = (float) $row->get('sales_tax', 0);

            // 明細割引
            $discountForThisRow = (float) $row->get('discount', 0);

            // 割引後金額（表示用）
            $netAmount   = $rowAmount - $discountForThisRow;
            $netAmountEx = $netAmount - $rowTax;

            // 内容 上（品番）
            $this->pdf->SetFontSize(8);
            $this->pdf->SetXY(self::X_CONTENT_L + 36.0, $yRowTop);
            $this->pdf->Cell(self::X_CONTENT_R - (self::X_CONTENT_L + 36.0), 4.5, (string)$row->get('item_number', ''));

            // 内容 下（商品名）
            // ★修正: item_name_jp が NULL/空 の場合は item_name を表示する
            $name = trim((string) $row->get('item_name_jp', ''));
            if ($name === '') {
                $name = trim((string) $row->get('item_name', ''));
            }

            $this->pdf->SetFontSize(10);
            $this->pdf->SetXY(self::X_CONTENT_L, $yRowTop + 3);
            $this->pdf->Cell(
                self::X_CONTENT_R - self::X_CONTENT_L,
                5.545,
                mb_strimwidth($name, 0, 34)
            );

            // 数量
            $this->pdf->SetFontSize(9);
            $this->pdf->SetXY(self::X_QTY_L, $yRowTop + 3);
            $this->pdf->Cell(self::X_QTY_R - self::X_QTY_L, 5.545, number_format((float)$row->get('quantity', 0)), 0, 0, "R");

            // 単位
            $unit = ((int)$row->get('item_kind', 1) === 2) ? "ｾｯﾄ" : "個";
            $this->pdf->SetXY(self::X_UNIT_L, $yRowTop + 2);
            $this->pdf->Cell(self::X_UNIT_R - self::X_UNIT_L, 6.545, $unit, 0, 0, "C");

            // 定価（sales_unit_price）
            $this->pdf->SetFontSize(8);
            $this->pdf->SetXY(self::X_LIST_L, $yRowTop + 2);
            $this->pdf->Cell(self::X_LIST_R - self::X_LIST_L, 6.545, number_format((float)$row->get('sales_unit_price', 0), 0), 0, 0, "R");

            // 掛率（rate）
            $this->pdf->SetFontSize(8);
            $this->pdf->SetXY(self::X_RATE_L, $yRowTop + 2);
            $rate = $row->get('rate', null);
            $rateText = ($rate === null || $rate === '') ? '' : ((string)$rate . '%');
            $this->pdf->Cell(self::X_RATE_R - self::X_RATE_L, 6.545, $rateText, 0, 0, "R");

            // 単価（unit_price）
            $this->pdf->SetFontSize(8);
            $this->pdf->SetXY(self::X_UNITPRICE_L, $yRowTop + 2);
            $this->pdf->Cell(self::X_UNITPRICE_R - self::X_UNITPRICE_L, 6.545, number_format((float)$row->get('unit_price', 0), 0), 0, 0, "R");

            // 割引
            if ($discountForThisRow != 0.0) {
                $this->pdf->SetFontSize(8);
                $this->pdf->SetXY(self::X_DISCOUNT_L, $yRowTop + 2);
                $this->pdf->Cell(self::X_DISCOUNT_R - self::X_DISCOUNT_L, 6.545, number_format($discountForThisRow, 0), 0, 0, "R");
            }

            // 金額 上（税抜）
            $this->pdf->SetFontSize(8);
            $this->pdf->SetXY(self::X_AMOUNT_L, $yRowTop);
            $this->pdf->Cell(self::X_AMOUNT_R - self::X_AMOUNT_L, 4.5, number_format($netAmountEx, 0), 0, 0, "R");

            // 金額 下（税込）
            $this->pdf->SetFontSize(12);
            $this->pdf->SetXY(self::X_AMOUNT_L, $yRowTop + 2.6);
            $this->pdf->Cell(self::X_AMOUNT_R - self::X_AMOUNT_L, 5.945, number_format($netAmount, 0), 0, 0, "R");
        }

        // 最終ページ：送料/手数料 + 集計3行を下固定
        if ($page === $max_page) {

            $ySummaryStart   = self::ROW_BASE_Y + self::ROW_HEIGHT * (self::PER_PAGE - self::SUMMARY_ROWS + 1);
            $ySubtotal       = $ySummaryStart;
            $yHeaderDiscount = $ySubtotal + self::ROW_HEIGHT;
            $yTotal          = $yHeaderDiscount + self::ROW_HEIGHT;

            $yExtra = $yRowTop;

            $shipping_amount = (float) $data->get('shipping_amount', 0);
            if ($shipping_amount > 0) {
                $next = $yExtra + self::ROW_HEIGHT;
                if ($next < $ySummaryStart) {
                    $yExtra = $next;
                    $this->pdf->SetFontSize(10);
                    $this->pdf->SetXY(self::X_CONTENT_L, $yExtra + 3);
                    $this->pdf->Cell(self::X_CONTENT_R - self::X_CONTENT_L, 5.545, "送料");
                    $this->pdf->SetFontSize(13);
                    $this->pdf->SetXY(self::X_AMOUNT_L, $yExtra + 2.6);
                    $this->pdf->Cell(self::X_AMOUNT_R - self::X_AMOUNT_L, 5.945, number_format($shipping_amount, 0), 0, 0, "R");
                }
            }

            $additional_shipping_amount = (float) $data->get('additional_shipping_amount', 0);
            if ($additional_shipping_amount > 0) {
                $next = $yExtra + self::ROW_HEIGHT;
                if ($next < $ySummaryStart) {
                    $yExtra = $next;
                    $this->pdf->SetFontSize(10);
                    $this->pdf->SetXY(self::X_CONTENT_L, $yExtra + 3);
                    $this->pdf->Cell(self::X_CONTENT_R - self::X_CONTENT_L, 5.545, "別途追加送料");
                    $this->pdf->SetFontSize(13);
                    $this->pdf->SetXY(self::X_AMOUNT_L, $yExtra + 2.6);
                    $this->pdf->Cell(self::X_AMOUNT_R - self::X_AMOUNT_L, 5.945, number_format($additional_shipping_amount, 0), 0, 0, "R");
                }
            }

            $fee = (float) $data->get('fee', 0);
            if ($fee > 0) {
                $next = $yExtra + self::ROW_HEIGHT;
                if ($next < $ySummaryStart) {
                    $yExtra = $next;
                    $this->pdf->SetFontSize(10);
                    $this->pdf->SetXY(self::X_CONTENT_L, $yExtra + 3);
                    $this->pdf->Cell(self::X_CONTENT_R - self::X_CONTENT_L, 5.545, "代引手数料");
                    $this->pdf->SetFontSize(13);
                    $this->pdf->SetXY(self::X_AMOUNT_L, $yExtra + 2.6);
                    $this->pdf->Cell(self::X_AMOUNT_R - self::X_AMOUNT_L, 5.945, number_format($fee, 0), 0, 0, "R");
                }
            }

            $totals = $this->calculatePdfTotals($data);
            $headerDiscount = $totals['discount'];
            $subtotal = $totals['subtotal'];
            $total = $totals['total'];

            // 小計
            $this->pdf->SetFontSize(10);
            $this->pdf->SetXY(self::X_CONTENT_L, $ySubtotal);
            $this->pdf->Cell(self::X_CONTENT_R - self::X_CONTENT_L, self::ROW_HEIGHT, "小　　　　計", 0, 0, "C");
            $this->pdf->SetFontSize(13);
            $this->pdf->SetXY(self::X_AMOUNT_L, $ySubtotal + 2);
            $this->pdf->Cell(self::X_AMOUNT_R - self::X_AMOUNT_L, 5.945, number_format($subtotal, 0), 0, 0, "R");

            // 値引
            $this->pdf->SetFontSize(10);
            $this->pdf->SetXY(self::X_CONTENT_L, $yHeaderDiscount);
            $this->pdf->Cell(self::X_CONTENT_R - self::X_CONTENT_L, self::ROW_HEIGHT, "値　　　　引", 0, 0, "C");
            $this->pdf->SetFontSize(13);
            $this->pdf->SetXY(self::X_AMOUNT_L, $yHeaderDiscount + 2);
            $this->pdf->Cell(self::X_AMOUNT_R - self::X_AMOUNT_L, 5.945, ($headerDiscount > 0 ? '▲' : '') . number_format($headerDiscount, 0), 0, 0, "R");

            // 合計
            $this->pdf->SetFontSize(10);
            $this->pdf->SetXY(self::X_CONTENT_L, $yTotal);
            $this->pdf->Cell(self::X_CONTENT_R - self::X_CONTENT_L, self::ROW_HEIGHT, "合　　　　計", 0, 0, "C");
            $this->pdf->SetFontSize(13);
            $this->pdf->SetXY(self::X_AMOUNT_L, $yTotal + 2);
            $this->pdf->Cell(self::X_AMOUNT_R - self::X_AMOUNT_L, 5.945, number_format($total, 0), 0, 0, "R");

            $this->writeFooterNotes($data);
        }
    }

    private function calculatePdfTotals(Collection $data): array
    {
        $details = new Collection($data->get('details', []));
        $detailsAmount = $details->sum(function ($detail) {
            return (float) (is_array($detail) ? ($detail['amount'] ?? 0) : ($detail->amount ?? 0));
        });

        $subtotal = $detailsAmount
            + (float)$data->get('shipping_amount', 0)
            + (float)$data->get('additional_shipping_amount', 0)
            + (float)$data->get('fee', 0);
        $discount = (float)$data->get('discount', 0);

        return [
            'subtotal' => $subtotal,
            'discount' => $discount,
            'total' => max($subtotal - $discount, 0),
        ];
    }

    private function writeFooterNotes(Collection $data): void
    {
        $remarks = (string) ($data->get('remarks', '') ?? '');
        $y = self::TABLE_BOTTOM_Y + 1;

        $this->pdf->SetFontSize(8);
        $this->pdf->SetXY(21.771, $y);
        $this->pdf->Cell(10, 4, "備考");
        if ($remarks !== '') {
            $this->pdf->SetXY(30, $y);
            $this->pdf->MultiCell(self::X_AMOUNT_R - 30, 3.6, $remarks);
        }
    }

    private function getFileId(string $prefix)
    {
        return $prefix . "_" . Str::random(32);
    }
}
