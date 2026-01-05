<?php

namespace App\Api\Sales\Services\Concerns;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * SalesReceiveOrderStatus
 *
 * 目的:
 * - 売上（t_sales / t_sale_details）の登録・更新・削除に伴い、
 *   受注側（t_receive_orders / t_receive_order_details）の「売上状態」を旧版互換で更新する。
 *
 * この trait が更新するもの:
 * 1) 受注明細 rd.sales_completed（0/1）
 *    - 明細単位で「受注数量 <= 売上数量合計」なら完了(1) とみなす
 * 2) 受注ヘッダに対する「has_sales」テーブル（0/1/2）
 *    - 0: 売上なし
 *    - 1: 売上あり かつ 全明細が売上完了（不足なし）
 *    - 2: 売上あり かつ 未完了明細あり（不足あり）
 *
 * 依存するリンク:
 * - 受注明細 ↔ 売上明細 の紐付け（SalesLinks が作る）
 *   receiveOrderSalesDetailLinkTable()
 *     例) t_link_r_order_sales_detail (receive_order_detail_id, sales_detail_id)
 *
 * 呼ばれるタイミング（SalesService 側の流れ）:
 * - store():
 *   1) 売上ヘッダ/明細保存
 *   2) リンク insert
 *   3) updateSalesCompleted(receive_order_id)
 *   4) updateHasSales(receive_order_id)
 * - update():
 *   受注紐付けがある売上なら同様に 3)4)
 * - delete():
 *   売上削除後、受注紐付けがあれば同様に 3)4)
 *
 * 注意:
 * - テーブル名・カラム有無は環境差があるため、存在しない場合は何もしない（安全側）。
 */
trait SalesReceiveOrderStatus
{
    /**
     * 旧版互換: 受注明細 rd.sales_completed の更新（0/1）
     *
     * 仕様:
     * - 各受注明細 rd について、リンクされた売上明細の quantity 合計(sales数量)を算出し、
     *   rd.quantity <= sales合計なら sales_completed=1、それ以外は 0。
     *
     * 実装方針:
     * - UPDATE ... LEFT JOIN (集計サブクエリ) の一括更新で旧版SQLに寄せている
     *
     * 依存:
     * - t_receive_order_details（または receive_order_details）
     * - sales_completed カラム（無い環境では更新しない）
     * - 受注明細↔売上明細リンクテーブル
     * - 売上明細テーブル（SalesDetail モデルの getTable）
     */
    private function updateSalesCompleted(int $receive_order_id): void
    {
        // 受注明細テーブル名（環境差吸収）
        $rdTable = Schema::hasTable('t_receive_order_details') ? 't_receive_order_details'
                 : (Schema::hasTable('receive_order_details') ? 'receive_order_details' : null);
        if (!$rdTable) return;

        // 受注明細 ↔ 売上明細 のリンクテーブル（環境差吸収）
        $link = $this->receiveOrderSalesDetailLinkTable();
        if (!$link) return;

        // 売上明細テーブル（モデル定義追従）
        $sdTable = $this->salesDetailTable();
        if (!Schema::hasTable($sdTable)) return;

        // sales_completed 列が無いなら更新不能（旧版互換のため何もしない）
        if (!$this->hasColumnSafe($rdTable, 'sales_completed')) return;

        /**
         * 旧版ロジックの核:
         * - 受注明細 rd.id ごとに、売上明細 quantity を合算した sd.quantity を作る
         * - rd.quantity <= IFNULL(sd.quantity,0) なら 1
         *
         * 注意:
         * - 売上明細側が SoftDelete の場合、deleted_at を考慮しないと「削除済み売上明細」まで合算される。
         *   現状は旧版互換優先で whereNull を入れていない。
         *   もし SalesDetail が SoftDeletes 運用なら、ここは改善余地あり（優先度2で検討）。
         */
        $sql = "
            UPDATE {$rdTable} AS rd
            LEFT JOIN (
                SELECT x.receive_order_detail_id, SUM(y.quantity) AS quantity
                FROM {$link} x
                INNER JOIN {$sdTable} y ON y.id = x.sales_detail_id
                GROUP BY x.receive_order_detail_id
            ) AS sd ON sd.receive_order_detail_id = rd.id
            SET rd.sales_completed = CASE
                WHEN rd.quantity <= IFNULL(sd.quantity, 0) THEN 1
                ELSE 0
            END
            WHERE rd.receive_order_id = ?
        ";

        DB::update($sql, [$receive_order_id]);
    }

    /**
     * 旧版互換: 受注単位の has_sales（0/1/2）を更新する
     *
     * 定義:
     * - 0: 売上なし（売上数量合計が 0）
     * - 1: 売上あり かつ 全明細が売上完了（不足が無い）
     * - 2: 売上あり かつ 未完了明細あり（どこかで 受注数量 > 売上数量合計）
     *
     * 実装方針:
     * - 受注→受注明細→リンク→売上明細を join して行を作り、
     *   PHP側で「明細単位の売上数量合計」と比較して 1/2 を判定する（旧版互換のため）。
     *
     * upsert:
     * - receive_order_id をキーとして updateOrInsert する
     *
     * 注意:
     * - ここも売上明細側の SoftDelete を考慮していない（旧版互換優先）。
     * - rd.item_kind は [1,2] のみ対象（旧版の対象範囲を踏襲）。
     */
    private function updateHasSales(int $receive_order_id): void
    {
        $hasSalesTbl = $this->receiveOrderHasSalesTable();
        if (!$hasSalesTbl) return;

        // 受注ヘッダ/明細テーブル名（環境差吸収）
        $rTable = Schema::hasTable('t_receive_orders') ? 't_receive_orders'
                : (Schema::hasTable('receive_orders') ? 'receive_orders' : null);
        $rdTable = Schema::hasTable('t_receive_order_details') ? 't_receive_order_details'
                 : (Schema::hasTable('receive_order_details') ? 'receive_order_details' : null);
        if (!$rTable || !$rdTable) return;

        $link = $this->receiveOrderSalesDetailLinkTable();
        if (!$link) return;

        $sdTable = $this->salesDetailTable();
        if (!Schema::hasTable($sdTable)) return;

        // 受注ID配下の「受注明細 × 売上明細（リンク経由）」の行を作る
        $rows = DB::table("{$rTable} as r")
            ->select([
                'rd.id as receive_detail_id',
                'rd.quantity as r_quantity',
                DB::raw('sd.quantity as s_quantity'),
            ])
            ->join("{$rdTable} as rd", 'rd.receive_order_id', '=', 'r.id')
            ->leftJoin("{$link} as l", 'l.receive_order_detail_id', '=', 'rd.id')
            ->leftJoin("{$sdTable} as sd", 'sd.id', '=', 'l.sales_detail_id')
            ->where('r.id', '=', $receive_order_id)
            ->whereIn('rd.item_kind', [1, 2])
            ->get();

        $has_sales = 0;

        // 売上数量合計が 0 より大きければ「売上あり」
        $sumSalesQty = (int)collect($rows)->sum(fn($x) => (int)($x->s_quantity ?? 0));

        if ($sumSalesQty > 0) {
            // 一旦「全部完了(1)」と仮置きし、どこか不足があれば「未完了あり(2)」へ
            $has_sales = 1;

            $groups = collect($rows)->groupBy('receive_detail_id');
            foreach ($groups as $g) {
                $rQty = (int)($g->first()->r_quantity ?? 0);
                $sQty = (int)$g->sum(fn($x) => (int)($x->s_quantity ?? 0));

                if ($rQty > $sQty) {
                    $has_sales = 2;
                    break;
                }
            }
        }

        // 受注ID単位で upsert（旧版互換）
        DB::table($hasSalesTbl)->updateOrInsert(
            ['receive_order_id' => $receive_order_id],
            ['has_sales' => $has_sales]
        );
    }
}
