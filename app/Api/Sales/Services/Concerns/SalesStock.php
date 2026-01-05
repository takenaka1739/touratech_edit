<?php

namespace App\Api\Sales\Services\Concerns;

use Illuminate\Support\Facades\DB;

trait SalesStock
{
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

    private function applyStockDeltaBySaleId(int $sales_id, int $sign): void
    {
        $details = $this->getSaleStockAffectDetails($sales_id);
        $this->applyStockDeltaByDetails($details, $sign);
    }

    private function applyStockDeltaByDetails(array $details, int $sign): void
    {
        if (empty($details)) return;

        $stockCol = $this->itemStockColumn();

        foreach ($details as $d) {
            $itemId = (int)($d['item_id'] ?? 0);
            $qty    = (int)($d['quantity'] ?? 0);
            if ($itemId <= 0 || $qty === 0) continue;

            if (!$this->hasColumnSafe('m_items', $stockCol)) {
                continue;
            }

            DB::table('m_items')
                ->where('id', $itemId)
                ->update([
                    $stockCol => DB::raw("{$stockCol} + " . ($sign * $qty)),
                ]);
        }
    }
}
