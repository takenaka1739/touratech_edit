<?php

namespace App\Api\Sales\Services\Concerns;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * SalesLinks
 *
 * 目的:
 * - 「売上 ↔ 受注」の紐付け（ヘッダ/明細）を管理する。
 * - 売上登録/更新/削除時に、リンクテーブルへ insert / delete することで、
 *   受注側の「売上済み数量集計」「売上ありフラグ」「sales_completed 更新」等が成立する。
 *
 * 対象テーブル（SalesSchemaResolver で解決）:
 * - 受注ヘッダ ↔ 売上ヘッダ: receiveOrderSalesLinkTable()
 *   例) t_link_r_order_sales (receive_order_id, sales_id)
 * - 受注明細 ↔ 売上明細: receiveOrderSalesDetailLinkTable()
 *   例) t_link_r_order_sales_detail (receive_order_detail_id, sales_detail_id)
 *
 * 使いどころ（呼ばれ方の流れ）:
 * - SalesService::store()
 *   - insertReceiveOrderSales()
 *   - insertDetails() → createDetailItems() → insertReceiveOrderDetailSalesDetail()
 * - SalesService::delete()
 *   - deleteReceiveOrderLinksBySalesId()
 * - SalesService::update()
 *   - 受注ID参照は getReceiveOrderIdBySaleId()（リンクがある場合）
 *
 * 注意:
 * - 「同一組み合わせの二重登録」を避けるため、insert 前に exists() を見る。
 * - ここでは FK 制約前提のエラーハンドリングはしない（上位の transaction に任せる）。
 */
trait SalesLinks
{
    /**
     * 受注ヘッダIDと売上ヘッダIDをリンクテーブルへ登録する。
     *
     * 想定:
     * - 1受注に対して複数売上が紐付く可能性がある（分納/部分売上）
     * - 逆に 1売上は 0 or 1 の受注に紐付く（このシステムの前提）
     */
    private function insertReceiveOrderSales(int $receive_order_id, int $sales_id): void
    {
        $tbl = $this->receiveOrderSalesLinkTable();
        if (!$tbl) return;

        // 二重登録防止（同一受注・同一売上の重複のみ排除）
        $exists = DB::table($tbl)
            ->where('receive_order_id', $receive_order_id)
            ->where('sales_id', $sales_id)
            ->exists();

        if (!$exists) {
            DB::table($tbl)->insert([
                'receive_order_id' => $receive_order_id,
                'sales_id' => $sales_id,
            ]);
        }
    }

    /**
     * 受注明細IDと売上明細IDをリンクテーブルへ登録する。
     *
     * 目的:
     * - 受注側で「受注明細ごとの売上済数量」を集計するための紐付け
     * - 分納・部分売上の数量差分管理の基礎になる
     */
    private function insertReceiveOrderDetailSalesDetail($receive_order_detail_id, int $sales_detail_id): void
    {
        if (!$receive_order_detail_id) return;

        $tbl = $this->receiveOrderSalesDetailLinkTable();
        if (!$tbl) return;

        // 二重登録防止（同一受注明細・同一売上明細の重複のみ排除）
        $exists = DB::table($tbl)
            ->where('receive_order_detail_id', $receive_order_detail_id)
            ->where('sales_detail_id', $sales_detail_id)
            ->exists();

        if (!$exists) {
            DB::table($tbl)->insert([
                'receive_order_detail_id' => $receive_order_detail_id,
                'sales_detail_id' => $sales_detail_id,
            ]);
        }
    }

    /**
     * 売上IDに紐づくリンクを削除する（ヘッダリンク/明細リンク）。
     *
     * 呼ばれるタイミング:
     * - SalesService::delete() 内（売上削除時）
     *
     * 削除順の意図:
     * - ヘッダリンクは sales_id で一括削除可能
     * - 明細リンクは sales_detail_id の集合で削除する必要があるため、
     *   まず売上明細テーブルから対象ID一覧を引いてから削除する
     *
     * 注意:
     * - 売上明細の delete より「前」に呼んでも「後」に呼んでも動くように実装しているが、
     *   明細IDを引く必要があるため、明細削除後に呼ぶとIDが取れない（環境差でSoftDeleteの可能性あり）。
     *   現行 delete() の実装では「明細削除前」に beforeDetails 取得しているので、
     *   ここも削除前に呼ぶ方が確実。（現状は SalesService::delete() では明細削除後に呼んでいるため、
     *   明細が物理deleteされる環境では detailIds が空になり、tbl2 の削除漏れが起きる可能性がある）
     *
     * 改善案（優先度2の整理で検討）:
     * - SalesService::delete() からこのメソッドを呼ぶ順序を「明細削除前」に変更する
     * - または beforeDetails のIDを引数で渡して tbl2 を確実に削除する
     */
    private function deleteReceiveOrderLinksBySalesId(int $sales_id): void
    {
        // 受注ヘッダ ↔ 売上ヘッダのリンクを削除
        $tbl1 = $this->receiveOrderSalesLinkTable();
        if ($tbl1) {
            DB::table($tbl1)->where('sales_id', $sales_id)->delete();
        }

        // 受注明細 ↔ 売上明細のリンクを削除
        $tbl2 = $this->receiveOrderSalesDetailLinkTable();
        if ($tbl2) {
            $detailTable = $this->salesDetailTable();

            if (Schema::hasTable($detailTable)) {
                // 売上明細IDを拾い、リンクテーブルから削除
                $detailIds = DB::table($detailTable)->where('sales_id', $sales_id)->pluck('id')->toArray();

                if (!empty($detailIds)) {
                    DB::table($tbl2)->whereIn('sales_detail_id', $detailIds)->delete();
                }
            }
        }
    }

    /**
     * 売上IDから受注IDを取得する。
     *
     * 目的:
     * - 売上更新/削除後に、受注側の状態更新（sales_completed / has_sales）を行うため、
     *   「この売上がどの受注に紐付いているか」を取得する。
     *
     * 仕様:
     * - リンクが無い（手入力売上等）場合は null。
     */
    private function getReceiveOrderIdBySaleId(int $sales_id): ?int
    {
        $tbl = $this->receiveOrderSalesLinkTable();
        if (!$tbl) return null;

        $row = DB::table($tbl)
            ->where('sales_id', $sales_id)
            ->first();

        return $row ? (int)$row->receive_order_id : null;
    }
}
