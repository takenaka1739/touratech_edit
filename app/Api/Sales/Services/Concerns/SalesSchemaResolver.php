<?php

namespace App\Api\Sales\Services\Concerns;

use App\Base\Models\SalesDetail;
use Illuminate\Support\Facades\Schema;

trait SalesSchemaResolver
{
    private function salesDateColumn(): string
    {
        // 現行は sales_at、旧画面/旧コードは sales_date の可能性
        if ($this->hasColumnSafe('t_sales', 'sales_at')) return 'sales_at';
        if ($this->hasColumnSafe('t_sales', 'sales_date')) return 'sales_date';
        return 'sales_at';
    }

    private function salesDetailTable(): string
    {
        // モデル定義が正ならこれでOK
        $m = new SalesDetail();
        return $m->getTable(); // 例: t_sale_details
    }

    private function itemStockColumn(): string
    {
        // 要件: domestic_stocks（なければ domestic_stock）
        if ($this->hasColumnSafe('m_items', 'domestic_stocks')) return 'domestic_stocks';
        return 'domestic_stock';
    }

    private function receiveOrderSalesLinkTable(): ?string
    {
        $candidates = [
            't_link_r_order_sales',
            'link_r_order_sales',
        ];
        foreach ($candidates as $t) {
            if (Schema::hasTable($t)) return $t;
        }
        return null;
    }

    private function receiveOrderSalesDetailLinkTable(): ?string
    {
        $candidates = [
            't_link_r_order_sales_detail',
            'link_r_order_sales_detail',
        ];
        foreach ($candidates as $t) {
            if (Schema::hasTable($t)) return $t;
        }
        return null;
    }

    private function receiveOrderHasSalesTable(): ?string
    {
        $candidates = [
            't_receive_order_has_sales',
            'receive_order_has_sales',
        ];
        foreach ($candidates as $t) {
            if (Schema::hasTable($t)) return $t;
        }
        return null;
    }

    private function invoiceLinkTable(): ?string
    {
        $candidates = [
            't_link_sales_invoice',
            'link_sales_invoice',
        ];
        foreach ($candidates as $t) {
            if (Schema::hasTable($t)) return $t;
        }
        return null;
    }

    private function hasColumnSafe(string $table, string $column): bool
    {
        try {
            return Schema::hasTable($table) && Schema::hasColumn($table, $column);
        } catch (\Throwable $e) {
            return false;
        }
    }

    private function resolveCustomerTable(): ?string
    {
        foreach (['t_customers', 'm_customers', 'customers'] as $t) {
            if (Schema::hasTable($t)) return $t;
        }
        return null;
    }

    private function resolveUserTable(): ?string
    {
        // 旧版は users、現行は m_personnels の可能性もあるが、一覧は「担当者名」を返したい
        foreach (['m_personnels', 'users'] as $t) {
            if (Schema::hasTable($t)) return $t;
        }
        return null;
    }
}
