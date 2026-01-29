<?php

namespace App\Api\Sales\Services\Concerns;

use App\Base\Models\Inventory;
use App\Base\Models\InventoryMove;
use Illuminate\Support\Facades\DB;

/**
 * SalesStock（旧版互換：t_inventories + t_inventory_moves で再計算）
 *
 * 方針:
 * - 旧版と同様に「売上保存/更新/削除のたびに」在庫を再計算して m_items の在庫列へ反映する。
 * - 手順:
 *   1) 対象 sales_id の t_inventory_moves（売上分）を作り直す
 *   2) 対象品番について
 *      base = t_inventories の最新(quantity)
 *      diff = t_inventory_moves（import_month以降の purchase - sales）
 *      stock = base + diff
 *      を m_items.domestic_stocks / domestic_stock へ上書きする
 *
 * 注意:
 * - 旧版の InventoryMove::getQuantity は「item_number に行が1件でもあれば」集計し、
 *   import_month が空なら「全期間」を集計する。ここは旧版互換のまま利用する。
 */
trait SalesStock
{
    /**
     * 売上が在庫に影響する明細の品番一覧を取得する
     *
     * 旧版互換:
     * - セット親(item_kind=2)を除外（<>2）
     * - SoftDeletes を考慮（deleted_at is null）
     */
    private function getSaleItemNumbers(int $sales_id): array
    {
        $detailTable = $this->salesDetailTable();

        $hasItemNumber = $this->hasColumnSafe($detailTable, 'item_number');
        $hasDeletedAt  = $this->hasColumnSafe($detailTable, 'deleted_at');

        $q = DB::table($detailTable . ' as d')
            ->where('d.sale_id', $sales_id)
            ->where('d.item_kind', '<>', 2);

        if ($hasDeletedAt) {
            $q->whereNull('d.deleted_at');
        }

        if ($hasItemNumber) {
            $q->select(['d.item_number']);
        } else {
            // 明細に item_number が無い環境向け（item_id -> m_items.item_number）
            $q->join('m_items as i', 'i.id', '=', 'd.item_id')
              ->select(['i.item_number as item_number']);
        }

        return $q->pluck('item_number')
            ->filter(fn($v) => $v !== null && $v !== '')
            ->map(fn($v) => (string)$v)
            ->unique()
            ->values()
            ->toArray();
    }

    /**
     * t_inventory_moves（売上分）を sales_id 単位で作り直す（旧版 insertInventoryMoves 相当）
     *
     * - detail_kind = 2（売上）
     * - job_date は t_sales の売上日（sales_at / sales_date）を採用
     *
     * 旧版互換:
     * - d.item_kind <> 2
     * - d.deleted_at is null（SoftDeletes）
     */
    private function rebuildInventoryMovesBySalesId(int $sales_id): void
    {
        if (!DB::getSchemaBuilder()->hasTable('t_inventory_moves')) {
            return;
        }

        DB::table('t_inventory_moves')->where('sales_id', $sales_id)->delete();

        $detailTable  = $this->salesDetailTable();
        $salesDateCol = $this->salesDateColumn();

        $hasItemNumber = $this->hasColumnSafe($detailTable, 'item_number');
        $hasDeletedAt  = $this->hasColumnSafe($detailTable, 'deleted_at');
        $hasCreatedAt  = $this->hasColumnSafe('t_inventory_moves', 'created_at');

        // item_number の取得式（明細に無ければ m_items から引く）
        $itemNumberExpr = $hasItemNumber ? 'd.item_number' : 'i.item_number';

        $insertCols = [
            'job_date',
            'detail_kind',
            'sales_id',
            'item_number',
            'quantity',
        ];
        if ($hasCreatedAt) {
            $insertCols[] = 'created_at';
        }

        $select = [
            DB::raw("s.{$salesDateCol} as job_date"),
            DB::raw((int)InventoryMove::EDIT_KIND_SALES . ' as detail_kind'),
            DB::raw('s.id as sales_id'),
            DB::raw("{$itemNumberExpr} as item_number"),
            DB::raw('d.quantity as quantity'),
        ];
        if ($hasCreatedAt) {
            $select[] = DB::raw('CURRENT_TIMESTAMP as created_at');
        }

        $q = DB::table('t_sales as s')
            ->join($detailTable . ' as d', 'd.sale_id', '=', 's.id')
            ->where('s.id', $sales_id)
            ->where('d.item_kind', '<>', 2);

        if ($hasDeletedAt) {
            $q->whereNull('d.deleted_at');
        }

        if (!$hasItemNumber) {
            $q->join('m_items as i', 'i.id', '=', 'd.item_id');
        }

        // Laravel 標準の insertUsing（toSql 組み立てより安全）
        DB::table('t_inventory_moves')->insertUsing($insertCols, $q->select($select));
    }

    /**
     * 旧版互換：t_inventories + t_inventory_moves で m_items の在庫を再計算して上書き
     *
     * @param int   $sales_id
     * @param array $pre_item_numbers 更新前の品番（update/delete で必須）
     */
    private function recalcDomesticStockBySalesId(int $sales_id, array $pre_item_numbers = []): void
    {
        $current = $this->getSaleItemNumbers($sales_id);
        $numbers = array_values(array_unique(array_merge($pre_item_numbers, $current)));

        if (empty($numbers)) {
            return;
        }

        $stockCol = $this->itemStockColumn();
        if (!$this->hasColumnSafe('m_items', $stockCol)) {
            return;
        }
        if (!$this->hasColumnSafe('m_items', 'item_number')) {
            return;
        }

        $latests = Inventory::getLatestInventories($numbers);

        foreach ($numbers as $number) {
            $import_month = '';
            $baseQty = 0;

            $l = $latests->get($number);
            if ($l && $l->count() > 0) {
                $row = $l->first();
                $import_month = (string)($row->import_month ?? '');
                $baseQty = (int)($row->quantity ?? 0);
            }

            $nextMonth = $this->addMonthCompat($import_month);

            $moveQty = InventoryMove::getQuantity($nextMonth, (string)$number);

            DB::table('m_items')
                ->where('item_number', $number)
                ->update([
                    $stockCol => (int)$baseQty + (int)$moveQty,
                ]);
        }
    }

    /**
     * 旧版 add_month 互換（import_month の翌月を返す）
     */
    private function addMonthCompat(string $import_month): string
    {
        $import_month = trim($import_month);
        if ($import_month === '') return '';

        if (function_exists('add_month')) {
            return (string)add_month($import_month);
        }

        $v = str_replace('-', '/', $import_month);

        if (preg_match('/^\d{4}\/\d{2}$/', $v) !== 1) {
            return $v;
        }

        [$y, $m] = explode('/', $v);
        $yy = (int)$y;
        $mm = (int)$m;

        $mm++;
        if ($mm >= 13) {
            $yy++;
            $mm = 1;
        }

        return sprintf('%04d/%02d', $yy, $mm);
    }
}
