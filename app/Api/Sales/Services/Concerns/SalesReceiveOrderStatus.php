<?php

namespace App\Api\Sales\Services\Concerns;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

trait SalesReceiveOrderStatus
{
    /**
     * 旧版互換: sales_completed の更新
     * - 受注明細 rd.quantity <= 売上明細合算 sd.quantity なら 1、そうでなければ 0
     */
    private function updateSalesCompleted(int $receive_order_id): void
    {
        $rdTable = Schema::hasTable('t_receive_order_details') ? 't_receive_order_details'
                 : (Schema::hasTable('receive_order_details') ? 'receive_order_details' : null);

        if (!$rdTable) return;

        $link = $this->receiveOrderSalesDetailLinkTable(); // t_link_r_order_sales_detail / link_r_order_sales_detail
        if (!$link) return;

        $sdTable = $this->salesDetailTable(); // t_sale_details（SalesDetail model）
        if (!Schema::hasTable($sdTable)) return;

        // 受注明細に sales_completed 列が無いなら更新しない（環境差吸収）
        if (!$this->hasColumnSafe($rdTable, 'sales_completed')) return;

        // 旧版SQLの「テーブル名差し替え版」
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
     * 旧版互換: has_sales の更新（0/1/2）
     * 0: 売上なし
     * 1: 売上あり かつ 全明細が売上完了
     * 2: 売上あり かつ 未完了明細あり
     */
    private function updateHasSales(int $receive_order_id): void
    {
        $hasSalesTbl = $this->receiveOrderHasSalesTable(); // t_receive_order_has_sales / receive_order_has_sales
        if (!$hasSalesTbl) return;

        $rTable = Schema::hasTable('t_receive_orders') ? 't_receive_orders'
                : (Schema::hasTable('receive_orders') ? 'receive_orders' : null);
        $rdTable = Schema::hasTable('t_receive_order_details') ? 't_receive_order_details'
                 : (Schema::hasTable('receive_order_details') ? 'receive_order_details' : null);

        if (!$rTable || !$rdTable) return;

        $link = $this->receiveOrderSalesDetailLinkTable();
        if (!$link) return;

        $sdTable = $this->salesDetailTable();
        if (!Schema::hasTable($sdTable)) return;

        // 旧版ロジックと同等の行を作る
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

        // s_quantity の合計が 0 より大きければ「売上あり」
        $sumSalesQty = (int)collect($rows)->sum(fn($x) => (int)($x->s_quantity ?? 0));
        if ($sumSalesQty > 0) {
            // 一旦 1（全部完了想定）→ どこか未完了があれば 2
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

        // upsert（旧版と同じ）
        DB::table($hasSalesTbl)->updateOrInsert(
            ['receive_order_id' => $receive_order_id],
            ['has_sales' => $has_sales]
        );
    }
}
