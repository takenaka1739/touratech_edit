<?php

namespace App\Api\Sales\Services\Concerns;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

trait SalesLinks
{
    private function insertReceiveOrderSales(int $receive_order_id, int $sales_id): void
    {
        $tbl = $this->receiveOrderSalesLinkTable();
        if (!$tbl) return;

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

    private function insertReceiveOrderDetailSalesDetail($receive_order_detail_id, int $sales_detail_id): void
    {
        if (!$receive_order_detail_id) return;

        $tbl = $this->receiveOrderSalesDetailLinkTable();
        if (!$tbl) return;

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

    private function deleteReceiveOrderLinksBySalesId(int $sales_id): void
    {
        $tbl1 = $this->receiveOrderSalesLinkTable();
        if ($tbl1) {
            DB::table($tbl1)->where('sales_id', $sales_id)->delete();
        }

        $tbl2 = $this->receiveOrderSalesDetailLinkTable();
        if ($tbl2) {
            $detailTable = $this->salesDetailTable();
            if (Schema::hasTable($detailTable)) {
                $detailIds = DB::table($detailTable)->where('sale_id', $sales_id)->pluck('id')->toArray();
                if (!empty($detailIds)) {
                    DB::table($tbl2)->whereIn('sales_detail_id', $detailIds)->delete();
                }
            }
        }
    }

    /**
     * 売上IDから受注IDを取得
     * - 受注売上リンク（t_link_r_order_sales 等）から参照する
     * - 紐づきが無い場合は null
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
