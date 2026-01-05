<?php

namespace App\Api\Sales\Services\Concerns;

use Illuminate\Support\Facades\DB;

/**
 * SalesStock
 *
 * 目的:
 * - 売上登録/更新/削除に伴う「在庫増減」を旧版互換で再現する。
 *
 * 前提/方針（このプロジェクトの要件に合わせた設計）:
 * - inventory_* 系テーブルは使わない。
 * - m_items の在庫カラム（domestic_stocks / domestic_stock）を直接増減する。
 * - 在庫増減の対象は「商品系 item_kind のみ」（ここでは [1,3]）とする。
 *
 * 在庫操作の呼ばれ方（SalesService 側の流れ）:
 * - store():
 *   - 売上作成後、applyStockDeltaBySaleId(sales_id, -1) で在庫を減らす
 * - update():
 *   - 更新前明細(beforeDetails)を +1 で一旦戻す
 *   - 更新後明細(afterDetails)を -1 で引く
 *   - これにより「差分」ではなく「全体を戻して引き直し」方式で整合性を担保する
 * - delete():
 *   - 削除前明細(beforeDetails)を +1 で戻す
 *
 * 注意:
 * - 在庫がマイナスになることを防ぐガードはここでは入れていない（旧版互換）。
 *   必要なら update() / store() 側で事前チェックを行う設計にする。
 */
trait SalesStock
{
    /**
     * 在庫に影響する売上明細を取得する
     *
     * 取得対象:
     * - sale_id = 指定売上ID
     * - item_kind IN [1,3]
     *   - [1] 通常商品
     *   - [3]（プロジェクト固有）在庫影響対象として扱う種別
     *
     * 返却形式:
     * - [ ['item_id'=>int, 'quantity'=>int], ... ]
     *
     * 使いどころ:
     * - update() の before/after 取得
     * - delete() の before 取得
     * - applyStockDeltaBySaleId() の内部
     */
    private function getSaleStockAffectDetails(int $sales_id): array
    {
        $detailTable = $this->salesDetailTable();

        return DB::table($detailTable)
            ->select(['item_id', 'quantity', 'item_kind'])
            ->where('sale_id', $sales_id)
            ->whereIn('item_kind', [1, 3])
            ->get()
            ->map(fn($r) => [
                'item_id' => (int)$r->item_id,
                'quantity' => (int)$r->quantity,
            ])
            ->toArray();
    }

    /**
     * 売上IDを元に在庫増減を適用する
     *
     * @param int $sales_id 売上ID
     * @param int $sign    -1: 減算（売上計上） / +1: 加算（取消・削除・更新前戻し）
     */
    private function applyStockDeltaBySaleId(int $sales_id, int $sign): void
    {
        $details = $this->getSaleStockAffectDetails($sales_id);
        $this->applyStockDeltaByDetails($details, $sign);
    }

    /**
     * 明細配列を元に在庫増減を適用する
     *
     * @param array $details [ ['item_id'=>int, 'quantity'=>int], ... ]
     * @param int   $sign    -1 or +1
     *
     * 実装メモ:
     * - 在庫カラムは SalesSchemaResolver::itemStockColumn() で解決する
     *   - domestic_stocks 優先 / なければ domestic_stock
     * - 対象列が存在しない環境では何もしない（安全側）
     */
    private function applyStockDeltaByDetails(array $details, int $sign): void
    {
        if (empty($details)) return;

        $stockCol = $this->itemStockColumn();

        foreach ($details as $d) {
            $itemId = (int)($d['item_id'] ?? 0);
            $qty    = (int)($d['quantity'] ?? 0);

            // 不正値は無視
            if ($itemId <= 0 || $qty === 0) continue;

            // 在庫列が無いなら更新しない（環境差・テーブル差吸収）
            if (!$this->hasColumnSafe('m_items', $stockCol)) {
                continue;
            }

            /**
             * 在庫更新:
             * - sign=-1: domestic_stock(s) を qty 分減らす
             * - sign=+1: domestic_stock(s) を qty 分戻す
             */
            DB::table('m_items')
                ->where('id', $itemId)
                ->update([
                    $stockCol => DB::raw("{$stockCol} + " . ($sign * $qty)),
                ]);
        }
    }
}
