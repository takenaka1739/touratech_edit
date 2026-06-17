<?php

namespace App\Api\Estimate\Services;

use App\Api\Shared\Services\ReportItemVariationTrait;
use App\Base\Pdf\PdfWrapper;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use Exception;

/**
 * 見積データPDFサービス（レイアウトC：掛率・定価列あり）
 */
class EstimatePdfService
{
    use ReportItemVariationTrait;

    const PER_PAGE = 14;

    /** @var \App\Base\Pdf\PdfWrapper */
    protected $pdf;

    /** @var string */
    protected $base_path;

    /**
     * 明細行（商品ごとの割引）をどこか1行にだけ出すためのフラグ
     * （複数ページになっても1回だけ表示する）
     */
    protected bool $discountPrinted = false;

    /** 明細枠内の固定値（既存レイアウトに合わせた座標） */
    private const TABLE_TOP_Y = 115.559;
    private const TABLE_BOTTOM_Y = 245.709;
    private const REMARKS_BOTTOM_Y = 291.000;
    private const ROW_HEIGHT = 8.545;
    private const ROW_BASE_Y = 113.395; // ループ内で y+=ROW_HEIGHT して1行目が121.94になる基準

    /** 明細枠の下3行に固定で出す集計行数（小計/値引/合計） */
    private const SUMMARY_ROWS = 3;

    /**
     * レイアウトC：列定義（X座標）
     * 左端は既存に合わせて 21.771、右端は Rect(21.541, ..., 174.864, ...) に合わせて 196.405 付近
     */
    private const X_LEFT = 21.771;
    private const X_RIGHT = 196.405;

    // 列境界
    private const X_CONTENT_R = 84.0;   // 内容・仕様 右端
    private const X_QTY_R = 106.0;      // 数量 右端
    private const X_UNIT_R = 116.0;     // 単位 右端
    private const X_RATE_R = 126.0;     // 掛率 右端
    private const X_LIST_R = 141.0;     // 定価 右端
    private const X_UNITPRICE_R = 154.0;// 単価 右端
    private const X_DISC_R = 167.0;     // 割引 右端
    private const X_AMOUNT_L = 167.0;   // 金額 左端（割引右端と同じ）

    public function __construct()
    {
        $this->base_path = config('const.paths.estimate.output_path');
    }

    public function getBasePath()
    {
        return $this->base_path;
    }

    /**
     * PDFを作成する
     */
    public function createPdf(array $data)
    {
        $this->pdf = new PdfWrapper("見積書【TTJP】 ");

        // 割引印字フラグ初期化
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

        [$ymd, $file_name] = explode('_', $file_id);
        $path = $this->base_path . $ymd . DIRECTORY_SEPARATOR;

        Storage::makeDirectory($path);

        return $path . $file_name;
    }

    /**
     * 書き込む（ページ数計算）
     *
     * - 送料/手数料は最終ページの明細枠内に行として出す
     * - 小計/値引/合計は「最終ページの明細枠下3行」に固定で出す（=常に3行確保）
     */
    protected function write(array $data)
    {
        $d       = new Collection($data);
        $details = $d->get('details', []);
        if (!is_array($details)) {
            $details = (array) $details;
        }

        // 最終ページに追加表示する「送料/代引手数料」行をカウント
        $extraRows = 0;
        if ((float)$d->get('shipping_amount', 0) > 0) $extraRows++;
        if ((float)$d->get('additional_shipping_amount', 0) > 0) $extraRows++;
        if ((float)$d->get('fee', 0) > 0)             $extraRows++;

        // ★小計/値引/合計（3行）を必ず確保
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
        $this->pdf->Cell(41.422, 7.171, "御見積書", 0, 0, "", false, "", 4);

        $this->pdf->SetFontSize(10);
        $this->pdf->TextRight(192.723, 21.633, $page . '頁');

        // 日付
        $y = ""; $m = ""; $d = "";
        $date = $data->get('estimate_date');
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
        $this->pdf->Text(19.908, 36.433, '見積No.' . $data->get('id'));

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
        $y = ""; $m = ""; $d = "";
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

        // 納入場所
        $this->pdf->Text(20.901, 77.523, "納入場所：");
        $this->pdf->Text(37, 77.523, $data->get('address1', "") . $data->get('address2', ""));

        // 取引方法
        $this->pdf->Text(20.901, 81.781, "取引方法：");
        $this->pdf->Text(37, 81.781, get_corporate_class_name($data->get('corporate_class')));

        // 有効期限
        $this->pdf->Text(20.901, 86.051, "有効期限：");
        $y = ""; $m = ""; $d = "";
        $date = $data->get('estimate_date');
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

        // 合計金額（ヘッダ表示は従来どおり total_amount）
        $this->pdf->lineBold();
        $this->pdf->rect(21.771, 96.413, 81.405, 12.764);
        $this->pdf->lineNormal();
        $this->pdf->lineH(50.915, 96.413, 12.764);

        $this->pdf->SetFontSize(11);
        $this->pdf->SetXY(24.373, 100.509);
        $this->pdf->Cell(23.054, 5.57, "合計金額", 0, 0, "", false, "", 4);
        $this->pdf->SetFontSize(16);
        $this->pdf->SetXY(50.915, 96.413);
        $this->pdf->Cell(51.5, 12.764, '￥' . number_format((float)$data->get('total_amount', 0), 0), 0, 0, "R");

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
        $this->pdf->Text(122.421, 85.063, '担当者：' . (string)$data->get('user_name', ''));

        // -----------------------------
        // 明細テーブル枠
        // -----------------------------
        $this->pdf->lineBold();
        $this->pdf->Rect(21.541, 115.505, 174.864, self::TABLE_BOTTOM_Y - 115.505);
        $this->pdf->lineW(21.771, 121.941, 174.864); // ヘッダ下
        $this->pdf->lineW(21.771, self::TABLE_BOTTOM_Y, 174.864); // 明細部と備考の境界

        // 縦線（備考枠には伸ばさない）
        $this->pdf->lineNormal();
        $detailHeight = self::TABLE_BOTTOM_Y - self::TABLE_TOP_Y;
        $this->pdf->lineH(self::X_CONTENT_R,   self::TABLE_TOP_Y, $detailHeight);
        $this->pdf->lineH(self::X_QTY_R,       self::TABLE_TOP_Y, $detailHeight);
        $this->pdf->lineH(self::X_UNIT_R,      self::TABLE_TOP_Y, $detailHeight);
        $this->pdf->lineH(self::X_RATE_R,      self::TABLE_TOP_Y, $detailHeight);
        $this->pdf->lineH(self::X_LIST_R,      self::TABLE_TOP_Y, $detailHeight);
        $this->pdf->lineH(self::X_UNITPRICE_R, self::TABLE_TOP_Y, $detailHeight);
        $this->pdf->lineH(self::X_DISC_R,      self::TABLE_TOP_Y, $detailHeight);

        // ヘッダ（列名）
        $this->pdf->SetFontSize(9);

        $this->pdf->SetXY(self::X_LEFT, 116.559);
        $this->pdf->Cell(self::X_CONTENT_R - self::X_LEFT, 6.436, "内　容　・　仕　様", 0, 0, "C");

        $this->pdf->SetXY(self::X_CONTENT_R, 116.559);
        $this->pdf->Cell(self::X_QTY_R - self::X_CONTENT_R, 6.436, "数　量", 0, 0, "C");

        $this->pdf->SetXY(self::X_QTY_R, 116.559);
        $this->pdf->Cell(self::X_UNIT_R - self::X_QTY_R, 6.436, "単位", 0, 0, "C");

        $this->pdf->SetXY(self::X_UNIT_R, 116.559);
        $this->pdf->Cell(self::X_RATE_R - self::X_UNIT_R, 6.436, "掛率", 0, 0, "C");

        $this->pdf->SetXY(self::X_RATE_R, 116.559);
        $this->pdf->Cell(self::X_LIST_R - self::X_RATE_R, 6.436, "定価", 0, 0, "C");

        $this->pdf->SetXY(self::X_LIST_R, 116.559);
        $this->pdf->Cell(self::X_UNITPRICE_R - self::X_LIST_R, 6.436, "単価", 0, 0, "C");

        $this->pdf->SetXY(self::X_UNITPRICE_R, 116.559);
        $this->pdf->Cell(self::X_DISC_R - self::X_UNITPRICE_R, 6.436, "割引", 0, 0, "C");

        $this->pdf->SetXY(self::X_DISC_R, 116.559);
        $this->pdf->Cell(self::X_RIGHT - self::X_DISC_R, 6.436, "金　　額", 0, 0, "C");

        // 横罫線（最下段まで）
        $h = 121.94;
        for ($i = 0; $i < self::PER_PAGE; $i++) {
            $h += self::ROW_HEIGHT;
            if ($h >= self::TABLE_BOTTOM_Y) break;
            $this->pdf->lineW(self::X_LEFT, $h, self::X_RIGHT - self::X_LEFT);
        }

        // -----------------------------
        // 明細描画
        // -----------------------------
        $details = new Collection($data->get('details', []));
        $rows    = $details->forPage($page, self::PER_PAGE);

        $yRowTop = self::ROW_BASE_Y;

        // 最終ページのみ：明細枠の下3行（小計/値引/合計）を明細で潰さない
        $isLastPage = ($page === $max_page);
        $ySummaryStart = self::ROW_BASE_Y + self::ROW_HEIGHT * (self::PER_PAGE - self::SUMMARY_ROWS + 1); // 16行目のy

        foreach ($rows as $row) {
            $row = new Collection($row);

            $nextY = $yRowTop + self::ROW_HEIGHT;
            if ($isLastPage && $nextY >= $ySummaryStart) {
                break;
            }
            $yRowTop = $nextY;

            /**
             * ★重要：PDFの「金額」は DB の amount をそのまま税込として扱う
             * - t_estimate_details.amount は「割引後の課税対象額に外税を乗せた税込金額」を想定
             * - ここで amount - discount をすると割引が二重に引かれてズレるため禁止
             */
            $amountIncTax = (float) $row->get('amount', 0);            // 税込（割引反映済み想定）
            $taxAmount    = (float) $row->get('sales_tax', 0);         // 税額（割引後に対する外税）
            $discountForThisRow = (float) $row->get('discount', 0);    // 明細割引（表示用）

            // 税抜は「税込 - 税額」で求める（外税前提）
            $amountExTax = $amountIncTax - $taxAmount;

            $rate = $row->get('rate', null);                           // 掛率
            $salesUnitPrice = (float) $row->get('sales_unit_price', 0);// 定価
            $unitPrice = (float) $row->get('unit_price', 0);           // 単価（税抜想定）

            // 内容 上（品番）
            $this->pdf->SetFontSize(8);
            $this->pdf->SetXY(self::X_LEFT + 36.0, $yRowTop);
            $this->pdf->Cell(self::X_CONTENT_R - (self::X_LEFT + 36.0), 4.5, (string)$row->get('item_number', ''));

            // 内容 下（商品名）
            $this->pdf->SetFontSize(10);
            $this->pdf->SetXY(self::X_LEFT, $yRowTop + 3);

            $name = trim((string) $row->get('item_name_jp', ''));
            if ($name === '') {
                $name = trim((string) $row->get('item_name', ''));
            }
            $name = $this->appendVariationToItemName($name, $row);

            $this->pdf->Cell(
                self::X_CONTENT_R - self::X_LEFT,
                5.545,
                mb_strimwidth($name, 0, 40)
            );

            // 数量
            $this->pdf->SetFontSize(9);
            $this->pdf->SetXY(self::X_CONTENT_R, $yRowTop + 3);
            $this->pdf->Cell(self::X_QTY_R - self::X_CONTENT_R, 5.545, number_format((float)$row->get('quantity', 0), 0), 0, 0, "R");

            // 単位
            $unit = ((int)$row->get('item_kind', 1) === 2) ? "ｾｯﾄ" : "個";
            $this->pdf->SetXY(self::X_QTY_R, $yRowTop + 2);
            $this->pdf->Cell(self::X_UNIT_R - self::X_QTY_R, 6.545, $unit, 0, 0, "C");

            // 掛率
            $this->pdf->SetXY(self::X_UNIT_R, $yRowTop + 2);
            $rateStr = ($rate === null || $rate === '') ? '' : ((string)$rate . '%');
            $this->pdf->Cell(self::X_RATE_R - self::X_UNIT_R, 6.545, $rateStr, 0, 0, "C");

            // 定価（小数なし）
            $this->pdf->SetXY(self::X_RATE_R, $yRowTop + 2);
            $this->pdf->Cell(self::X_LIST_R - self::X_RATE_R, 6.545, $salesUnitPrice ? number_format($salesUnitPrice, 0) : '', 0, 0, "R");

            // 単価（小数なし）
            $this->pdf->SetXY(self::X_LIST_R, $yRowTop + 2);
            $this->pdf->Cell(self::X_UNITPRICE_R - self::X_LIST_R, 6.545, $unitPrice ? number_format($unitPrice, 0) : '', 0, 0, "R");

            // 割引（明細、小数なし）※表示のみ（amount からは引かない）
            $this->pdf->SetXY(self::X_UNITPRICE_R, $yRowTop + 2);
            $this->pdf->Cell(self::X_DISC_R - self::X_UNITPRICE_R, 6.545, $discountForThisRow ? number_format($discountForThisRow, 0) : '', 0, 0, "R");

            /**
             * 金額（上：税抜 / 下：税込）
             * - 下段は「税込（DBの amount）」を表示することで、画面とPDFの一致を担保
             */
            $this->pdf->SetFontSize(9);
            $this->pdf->SetXY(self::X_AMOUNT_L, $yRowTop);
            $this->pdf->Cell(self::X_RIGHT - self::X_AMOUNT_L, 4.5, $amountExTax ? number_format($amountExTax, 0) : '', 0, 0, "R");

            $this->pdf->SetFontSize(13);
            $this->pdf->SetXY(self::X_AMOUNT_L, $yRowTop + 2.6);
            $this->pdf->Cell(self::X_RIGHT - self::X_AMOUNT_L, 5.945, $amountIncTax ? number_format($amountIncTax, 0) : '0', 0, 0, "R");
        }

        // -----------------------------
        // 最終ページ：送料/手数料 + 集計（小計/値引/合計）を下3行固定で描画
        // -----------------------------
        if ($page === $max_page) {

            $ySummaryStart = self::ROW_BASE_Y + self::ROW_HEIGHT * (self::PER_PAGE - self::SUMMARY_ROWS + 1);
            $ySubtotal = $ySummaryStart;                      // 16行目
            $yHeaderDiscount = $ySubtotal + self::ROW_HEIGHT; // 17行目
            $yTotal = $yHeaderDiscount + self::ROW_HEIGHT;    // 18行目

            // 送料/代引手数料は集計開始より上で詰めて表示
            $yExtra = $yRowTop;

            $shipping_amount = (float) $data->get('shipping_amount', 0);
            if ($shipping_amount > 0) {
                $next = $yExtra + self::ROW_HEIGHT;
                if ($next < $ySummaryStart) {
                    $yExtra = $next;

                    $this->pdf->SetFontSize(10);
                    $this->pdf->SetXY(self::X_LEFT, $yExtra + 3);
                    $this->pdf->Cell(self::X_CONTENT_R - self::X_LEFT, 5.545, "送料");

                    $this->pdf->SetFontSize(13);
                    $this->pdf->SetXY(self::X_AMOUNT_L, $yExtra + 2.6);
                    $this->pdf->Cell(self::X_RIGHT - self::X_AMOUNT_L, 5.945, number_format($shipping_amount, 0), 0, 0, "R");
                }
            }

            $additional_shipping_amount = (float) $data->get('additional_shipping_amount', 0);
            if ($additional_shipping_amount > 0) {
                $next = $yExtra + self::ROW_HEIGHT;
                if ($next < $ySummaryStart) {
                    $yExtra = $next;
                    $this->pdf->SetFontSize(10);
                    $this->pdf->SetXY(self::X_LEFT, $yExtra + 3);
                    $this->pdf->Cell(self::X_CONTENT_R - self::X_LEFT, 5.545, "別途追加送料");
                    $this->pdf->SetFontSize(13);
                    $this->pdf->SetXY(self::X_AMOUNT_L, $yExtra + 2.6);
                    $this->pdf->Cell(self::X_RIGHT - self::X_AMOUNT_L, 5.945, number_format($additional_shipping_amount, 0), 0, 0, "R");
                }
            }

            $fee = (float) $data->get('fee', 0);
            if ($fee > 0) {
                $next = $yExtra + self::ROW_HEIGHT;
                if ($next < $ySummaryStart) {
                    $yExtra = $next;

                    $this->pdf->SetFontSize(10);
                    $this->pdf->SetXY(self::X_LEFT, $yExtra + 3);
                    $this->pdf->Cell(self::X_CONTENT_R - self::X_LEFT, 5.545, "代引手数料");

                    $this->pdf->SetFontSize(13);
                    $this->pdf->SetXY(self::X_AMOUNT_L, $yExtra + 2.6);
                    $this->pdf->Cell(self::X_RIGHT - self::X_AMOUNT_L, 5.945, number_format($fee, 0), 0, 0, "R");
                }
            }

            // 親の値引（手入力）
            $headerDiscount = (float) $data->get('discount', 0);

            // 集計値：小計 = 合計 + 値引（値引が合計から引かれている想定）
            $total = (float) $data->get('total_amount', 0);
            $subtotal = $total + $headerDiscount;

            // 小計（下3行固定）
            $this->pdf->SetFontSize(10);
            $this->pdf->SetXY(self::X_LEFT, $ySubtotal);
            $this->pdf->Cell(self::X_CONTENT_R - self::X_LEFT, self::ROW_HEIGHT, "小　　　　計", 0, 0, "C");

            $this->pdf->SetFontSize(13);
            $this->pdf->SetXY(self::X_AMOUNT_L, $ySubtotal + 2);
            $this->pdf->Cell(self::X_RIGHT - self::X_AMOUNT_L, 5.945, number_format($subtotal, 0), 0, 0, "R");

            // 値引（親）
            $this->pdf->SetFontSize(10);
            $this->pdf->SetXY(self::X_LEFT, $yHeaderDiscount);
            $this->pdf->Cell(self::X_CONTENT_R - self::X_LEFT, self::ROW_HEIGHT, "値　　　　引", 0, 0, "C");

            $this->pdf->SetFontSize(13);
            $this->pdf->SetXY(self::X_AMOUNT_L, $yHeaderDiscount + 2);
            $discText = ($headerDiscount > 0) ? ('▲' . number_format($headerDiscount, 0)) : number_format($headerDiscount, 0);
            $this->pdf->Cell(self::X_RIGHT - self::X_AMOUNT_L, 5.945, $discText, 0, 0, "R");

            // 合計
            $this->pdf->SetFontSize(10);
            $this->pdf->SetXY(self::X_LEFT, $yTotal);
            $this->pdf->Cell(self::X_CONTENT_R - self::X_LEFT, self::ROW_HEIGHT, "合　　　　計", 0, 0, "C");

            $this->pdf->SetFontSize(13);
            $this->pdf->SetXY(self::X_AMOUNT_L, $yTotal + 2);
            $this->pdf->Cell(self::X_RIGHT - self::X_AMOUNT_L, 5.945, number_format($total, 0), 0, 0, "R");

            $this->writeFooterNotes($data);
        }
    }

    private function writeFooterNotes(Collection $data): void
    {
        $remarks = (string) ($data->get('remarks', '') ?? '');
        $ecNotices = $data->get('ec_notices', []);
        if (!is_array($ecNotices)) {
            $ecNotices = (array)$ecNotices;
        }

        $y = self::TABLE_BOTTOM_Y + 1;
        $boxHeight = self::REMARKS_BOTTOM_Y - self::TABLE_BOTTOM_Y;
        $text = trim($remarks);

        if (!empty($ecNotices)) {
            $ecText = implode("\n", array_slice($ecNotices, 0, 5));
            $text = trim($text . ($text !== '' ? "\n" : '') . "EC情報\n" . $ecText);
        }

        $this->pdf->lineBold();
        $this->pdf->Rect(21.541, self::TABLE_BOTTOM_Y, 174.864, $boxHeight);
        $this->pdf->lineNormal();

        $this->pdf->SetFontSize(8);
        $this->pdf->SetXY(21.771, $y);
        $this->pdf->Cell(12, 4, "備考");
        if ($text !== '') {
            $this->pdf->SetXY(33, $y);
            $lineHeight = 3.2;
            $maxLines = (int) floor((self::REMARKS_BOTTOM_Y - $y - 1) / $lineHeight);
            $this->pdf->MultiCell(
                self::X_RIGHT - 33,
                $lineHeight,
                $this->fitTextLines($text, $maxLines, 92)
            );
        }
    }

    private function fitTextLines(string $text, int $maxLines, int $maxWidth): string
    {
        $lines = [];
        $text = str_replace(["\r\n", "\r"], "\n", $text);

        foreach (explode("\n", $text) as $sourceLine) {
            $line = (string) $sourceLine;

            if ($line === '') {
                $lines[] = '';
                if (count($lines) >= $maxLines) {
                    break;
                }
                continue;
            }

            while ($line !== '') {
                $segment = '';
                $length = mb_strlen($line);

                for ($i = 0; $i < $length; $i++) {
                    $candidate = $segment . mb_substr($line, $i, 1);
                    if (mb_strwidth($candidate) > $maxWidth) {
                        break;
                    }
                    $segment = $candidate;
                }

                if ($segment === '') {
                    $segment = mb_substr($line, 0, 1);
                }

                $lines[] = $segment;
                $line = mb_substr($line, mb_strlen($segment));

                if (count($lines) >= $maxLines) {
                    break 2;
                }
            }
        }

        if (count($lines) >= $maxLines && mb_strlen(implode("\n", $lines)) < mb_strlen($text)) {
            $last = array_pop($lines) ?? '';
            $lines[] = mb_strimwidth($last, 0, max(0, $maxWidth - 3), '') . '...';
        }

        return implode("\n", $lines);
    }

    private function getFileId(string $prefix)
    {
        return $prefix . "_" . Str::random(32);
    }
}
