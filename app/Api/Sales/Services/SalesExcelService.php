<?php

namespace App\Api\Sales\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Cell\DataType;

class SalesExcelService
{
    public function generate(array $filters = []): array
    {
        Log::info('SalesExcel: incoming filters', ['filters' => $filters]);

        // ===== 日付レンジ（[from, to) 文字列：Y-m-d H:i:s） =====
        [$fromAt, $toAt] = $this->parseRange($filters);
        $fromDate = substr($fromAt, 0, 10);
        $toDate   = substr($toAt,   0, 10);

        $salesTbl = 't_sales';
        if (!Schema::hasTable($salesTbl)) {
            throw new \RuntimeException('t_sales が見つかりません');
        }

        $customersTbl   = $this->firstExisting(['t_customers','m_customers','customers']);
        $usersTbl       = $this->firstExisting(['m_users','t_users','users']);
        $personnelsTbl  = $this->firstExisting(['m_personnels','t_personnels','personnels']);
        $salesDetails   = Schema::hasTable('t_sale_details') ? 't_sale_details' : null;

        // 列存在
        $hasShipToName  = Schema::hasColumn($salesTbl, 'ship_to_name');
        $hasCustomerNm  = Schema::hasColumn($salesTbl, 'customer_name');
        $hasUserNm      = Schema::hasColumn($salesTbl, 'user_name');
        $hasUserId      = Schema::hasColumn($salesTbl, 'user_id');
        $hasPersonnelId = Schema::hasColumn($salesTbl, 'personnel_id');
        $hasOrderNo     = Schema::hasColumn($salesTbl, 'order_no');
        $hasTotalAmount = Schema::hasColumn($salesTbl, 'total_amount');

        // 明細合計（あれば）
        $sumJoined = false;
        $subQuery  = null;
        if ($salesDetails) {
            $subQuery = DB::table($salesDetails)
                ->select('sales_id', DB::raw('SUM(amount) as sum_amount'))
                ->groupBy('sales_id');
            $sumJoined = true;
        }

        /**
         * クエリビルド
         * @param 'normal'|'whereDate'|'none' $dateMode  日付条件の付与モード
         */
        $buildQuery = function(string $dateMode = 'normal') use (
            $salesTbl, $customersTbl, $usersTbl, $personnelsTbl, $salesDetails,
            $hasShipToName, $hasCustomerNm, $hasUserNm, $hasUserId, $hasPersonnelId, $hasOrderNo, $hasTotalAmount,
            $sumJoined, $subQuery,
            $filters, $fromAt, $toAt, $fromDate, $toDate
        ) {
            $q = DB::table("$salesTbl as s")->select(['s.id','s.sales_at']);

            // 得意先補完: s.customer_name → c.name → s.ship_to_name → ''
            $customerExprParts = [];
            if ($hasCustomerNm)                                     $customerExprParts[] = "NULLIF(s.customer_name,'')";
            if ($customersTbl && Schema::hasColumn($salesTbl,'customer_id')) $customerExprParts[] = "c.name";
            if ($hasShipToName)                                     $customerExprParts[] = "s.ship_to_name";
            $customerExpr = !empty($customerExprParts)
                ? 'COALESCE('.implode(',', $customerExprParts).", '')"
                : ($hasShipToName ? "COALESCE(s.ship_to_name,'')" : "''");
            $q->addSelect(DB::raw("$customerExpr as customer_name"));

            // 担当者補完: s.user_name → u.name → p.name → ''
            $personExprParts = [];
            if ($hasUserNm)                 $personExprParts[] = "NULLIF(s.user_name,'')";
            if ($usersTbl && $hasUserId)    $personExprParts[] = "u.name";
            if ($personnelsTbl && $hasPersonnelId) $personExprParts[] = "p.name";
            $personExpr = !empty($personExprParts)
                ? 'COALESCE('.implode(',', $personExprParts).", '')"
                : "''";
            $q->addSelect(DB::raw("$personExpr as personnel_name"));

            // JOINs
            if ($customersTbl && Schema::hasColumn($salesTbl,'customer_id')) {
                $q->leftJoin("$customersTbl as c", 'c.id', '=', 's.customer_id');
            }
            if ($usersTbl && $hasUserId) {
                $q->leftJoin("$usersTbl as u", 'u.id', '=', 's.user_id');
            }
            if ($personnelsTbl && $hasPersonnelId) {
                $q->leftJoin("$personnelsTbl as p", 'p.id', '=', 's.personnel_id');
            }
            if ($sumJoined && $subQuery) {
                $q->leftJoinSub($subQuery, 'd', 'd.sales_id', '=', 's.id');
            }

            // 金額
            $amountExpr = $hasTotalAmount
                ? ($sumJoined ? 'COALESCE(s.total_amount, d.sum_amount, 0)' : 'COALESCE(s.total_amount, 0)')
                : ($sumJoined ? 'COALESCE(d.sum_amount, 0)' : '0');
            $q->addSelect(DB::raw("$amountExpr as total_amount"));

            // ===== 日付条件 =====
            if ($dateMode === 'normal') {
                $q->where(function($w) use ($fromAt, $toAt, $fromDate, $toDate) {
                    // 1) そのまま比較
                    $w->where(function($w1) use ($fromAt, $toAt) {
                        $w1->where('s.sales_at', '>=', $fromAt)
                           ->where('s.sales_at', '<',  $toAt);
                    })
                    // 2) 'YYYY/MM/DD' 文字列救済
                    ->orWhereRaw(
                        "STR_TO_DATE(REPLACE(s.sales_at,'/','-'), '%Y-%m-%d') >= ? AND STR_TO_DATE(REPLACE(s.sales_at,'/','-'), '%Y-%m-%d') < ?",
                        [$fromDate, $toDate]
                    );
                });
            } elseif ($dateMode === 'whereDate') {
                $q->where(function($w) use ($fromDate, $toDate) {
                    $w->whereDate('s.sales_at', '>=', $fromDate)
                      ->whereDate('s.sales_at', '<',  $toDate);
                });
            }
            // 'none' の場合は日付条件を入れない

            // LIKE エスケープ
            $like = function (string $s): string {
                $s = str_replace(['\\','%','_'], ['\\\\','\\%','\\_'], $s);
                return "%{$s}%";
            };

            // ===== テキスト条件 =====
            if (!empty($filters['c_customer_name'])) {
                $kw = $like($filters['c_customer_name']);
                $q->where(function($w) use ($kw, $hasCustomerNm, $hasShipToName) {
                    if ($hasCustomerNm) { $w->orWhere('s.customer_name', 'like', $kw); }
                    $w->orWhere('c.name', 'like', $kw);
                    if ($hasShipToName) { $w->orWhere('s.ship_to_name', 'like', $kw); }
                });
            }

            if (!empty($filters['c_user_name'])) {
                $kw = $like($filters['c_user_name']);
                $q->where(function($w) use ($kw, $hasUserNm) {
                    if ($hasUserNm) { $w->orWhere('s.user_name', 'like', $kw); }
                    $w->orWhere('u.name', 'like', $kw)
                      ->orWhere('p.name', 'like', $kw);
                });
            }

            if (!empty($filters['c_order_no']) && $hasOrderNo) {
                $q->where('s.order_no', 'like', $like($filters['c_order_no']));
            }

            if ($salesDetails && ( !empty($filters['c_item_number']) || !empty($filters['c_name']) )) {
                $q->whereExists(function($sq) use ($salesDetails, $filters, $like) {
                    $sq->from($salesDetails.' as sd')->whereColumn('sd.sales_id', 's.id');
                    if (!empty($filters['c_item_number']) && Schema::hasColumn($salesDetails, 'item_number')) {
                        $sq->where('sd.item_number', 'like', $like($filters['c_item_number']));
                    }
                    if (!empty($filters['c_name'])) {
                        $nameKw = $like($filters['c_name']);
                        $sq->where(function($w2) use ($salesDetails, $nameKw) {
                            if (Schema::hasColumn($salesDetails, 'item_name')) {
                                $w2->orWhere('sd.item_name', 'like', $nameKw);
                            }
                            if (Schema::hasColumn($salesDetails, 'item_name_jp')) {
                                $w2->orWhere('sd.item_name_jp', 'like', $nameKw);
                            }
                        });
                    }
                });
            }

            return $q->orderBy('s.sales_at')->orderBy('s.id');
        };

        // 1回目：通常条件
        $rows = $buildQuery('normal')->get();

        // 2回目：whereDate フォールバック
        if ($rows->count() === 0) {
            $rows = $buildQuery('whereDate')->get();
        }

        // 3回目：最新売上月
        if ($rows->count() === 0) {
            $latest = DB::table($salesTbl)->max('sales_at');
            if ($latest) {
                $latestNorm = date('Y-m-d', strtotime(str_replace('/', '-', (string)$latest)));
                $firstOfMonth = date('Y-m-01 00:00:00', strtotime($latestNorm));
                $firstOfNext  = date('Y-m-d 00:00:00', strtotime($firstOfMonth . ' +1 month'));
                $rows = $buildQuery('none')
                    ->where('s.sales_at', '>=', $firstOfMonth)
                    ->where('s.sales_at', '<',  $firstOfNext)
                    ->get();
                Log::warning('SalesExcel: used latest month fallback', [
                    'month' => substr($firstOfMonth,0,7),
                    'count' => $rows->count()
                ]);
            }
        }

        // 4回目：それでも0なら直近50件（同じ SELECT/JOIN で日付条件なし）
        if ($rows->count() === 0) {
            $latestIds = DB::table("$salesTbl as s")
                ->orderBy('s.sales_at', 'desc')
                ->limit(50)
                ->pluck('s.id')
                ->all();

            if (!empty($latestIds)) {
                $rows = $buildQuery('none')
                    ->whereIn('s.id', $latestIds)
                    ->orderBy('s.sales_at', 'asc')
                    ->orderBy('s.id', 'asc')
                    ->get();
                Log::warning('SalesExcel: show latest 50 rows fallback (with joins)', [
                    'count' => $rows->count(),
                    'ids'   => array_slice($latestIds, 0, 5)
                ]);
            } else {
                Log::warning('SalesExcel: no data even for latest 50 fallback');
            }
        }

        Log::info('SalesExcel: final row count', ['count' => $rows->count(), 'from' => $fromAt, 'to' => $toAt]);

        // ===== Excel =====
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->fromArray(['売上日', '得意先名', '担当者', '金額'], null, 'A1', true);

        $r = 2;
        foreach ($rows as $row) {
            $sheet->setCellValueExplicit("A{$r}", substr((string)$row->sales_at, 0, 10), DataType::TYPE_STRING);
            $sheet->setCellValue("B{$r}", (string)($row->customer_name ?? ''));
            $sheet->setCellValue("C{$r}", (string)($row->personnel_name ?? ''));
            $sheet->setCellValue("D{$r}", (float)($row->total_amount ?? 0));
            $r++;
        }

        if ($r > 2) {
            $sheet->getStyle("D2:D".($r-1))->getNumberFormat()->setFormatCode('#,##0');
        }
        $sheet->getColumnDimension('A')->setWidth(12);
        $sheet->getColumnDimension('B')->setWidth(30);
        $sheet->getColumnDimension('C')->setWidth(18);
        $sheet->getColumnDimension('D')->setWidth(14);

        $fileId = $this->newFileId();
        $path   = $this->getStoragePath($fileId);
        Storage::makeDirectory(dirname($path));
        (new Xlsx($spreadsheet))->save(Storage::path($path));

        return ['file_id' => $fileId];
    }

    public function getStoragePath(string $fileId): string
    {
        $fid = preg_replace('/\.xlsx$/i', '', $fileId);
        return "sales/export/{$fid}.xlsx";
    }

    private function firstExisting(array $cands): ?string
    {
        foreach ($cands as $cand) {
            if (Schema::hasTable($cand)) return $cand;
        }
        return null;
    }

    /**
     * [from, to) に正規化
     * - from/to 両方あり → to を翌日00:00:00 に進める（最終日を含める）
     * - from のみ       → **to = 今日+1日 00:00:00**（「開始日から現在まで」）
     * - to のみ         → from = to の前日00:00:00（1日分）
     * - 未指定          → 当日
     * - 'YYYY/MM/DD' も許容
     */
    private function parseRange(array $filters): array
    {
        $norm = function (?string $v): ?string {
            if (!$v) return null;
            $v = str_replace('/', '-', trim($v));
            if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $v)) {
                $v .= ' 00:00:00';
            }
            return $v;
        };

        $from = $norm($filters['from'] ?? null);
        $to   = $norm($filters['to']   ?? null);

        if ($from && $to) {
            $to = date('Y-m-d H:i:s', strtotime(substr($to, 0, 10).' +1 day'));
        } elseif ($from && !$to) {
            $today = date('Y-m-d');
            $to    = date('Y-m-d H:i:s', strtotime("$today +1 day")); // ← ここを修正
        } elseif (!$from && $to) {
            $from = date('Y-m-d H:i:s', strtotime(substr($to, 0, 10).' -1 day'));
        } else {
            $today = date('Y-m-d');
            $from  = "{$today} 00:00:00";
            $to    = date('Y-m-d H:i:s', strtotime("$today +1 day"));
        }

        return [$from, $to];
    }

    private function newFileId(): string
    {
        return 'sales_'.date('Ymd_His').'_'.substr(bin2hex(random_bytes(4)), 0, 8);
    }
}
