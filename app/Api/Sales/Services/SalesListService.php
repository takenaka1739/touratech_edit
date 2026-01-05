<?php

namespace App\Api\Sales\Services;

use App\Base\Models\SalesDetail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SalesListService
{
    /**
     * 売上一覧を取得する
     *
     * 返却形式はフロント共通に合わせて { rows, pager } を返す。
     */
    public function getList(array $conditions): array
    {
        $salesTable = 't_sales';

        $customerTable = Schema::hasTable('t_customers') ? 't_customers'
                       : (Schema::hasTable('m_customers') ? 'm_customers' : null);

        $personnelTable = Schema::hasTable('m_personnels') ? 'm_personnels'
                        : (Schema::hasTable('users') ? 'users' : null);

        $detailTable = (new SalesDetail())->getTable();

        $detailFk = null;
        foreach (['sale_id', 'sales_id'] as $c) {
            if (Schema::hasTable($detailTable) && Schema::hasColumn($detailTable, $c)) {
                $detailFk = $c;
                break;
            }
        }

        // ★追加：売上-請求連結テーブル（旧は link_sales_invoice、新は t_link_sales_invoice の可能性）
        $salesInvoiceLinkTable = Schema::hasTable('t_link_sales_invoice') ? 't_link_sales_invoice'
                              : (Schema::hasTable('link_sales_invoice') ? 'link_sales_invoice' : null);

        // ★追加：link が無い環境でも落ちないように 0 固定にフォールバック
        $hasInvoiceExpr = $salesInvoiceLinkTable
            ? "EXISTS(SELECT 1 FROM {$salesInvoiceLinkTable} x WHERE x.sales_id = sales.id)"
            : "0";

        $query = DB::table("{$salesTable} as sales")
            ->select([
                'sales.id',
                'sales.sales_at',
                'sales.total_amount',
                DB::raw("{$hasInvoiceExpr} as has_invoice"),
                DB::raw($customerTable ? "customers.name as customer_name" : "'' as customer_name"),
                DB::raw($personnelTable ? "personnels.name as personnel_name" : "'' as personnel_name"),
            ]);

        if ($customerTable) {
            $query->leftJoin("{$customerTable} as customers", 'sales.customer_id', '=', 'customers.id');
        }
        if ($personnelTable) {
            if (Schema::hasColumn($salesTable, 'personnel_id')) {
                $query->leftJoin("{$personnelTable} as personnels", 'sales.personnel_id', '=', 'personnels.id');
            } elseif (Schema::hasColumn($salesTable, 'user_id')) {
                $query->leftJoin("{$personnelTable} as personnels", 'sales.user_id', '=', 'personnels.id');
            }
        }

        // 検索条件
        if (!empty($conditions['c_sales_date_from'])) {
            $query->where('sales.sales_at', '>=', $conditions['c_sales_date_from']);
        }
        if (!empty($conditions['c_sales_date_to'])) {
            $query->where('sales.sales_at', '<=', $conditions['c_sales_date_to']);
        }
        if (!empty($conditions['c_customer_name']) && $customerTable) {
            $query->where('customers.name', 'like', '%' . $conditions['c_customer_name'] . '%');
        }
        if (!empty($conditions['c_user_name']) && $personnelTable) {
            $query->where('personnels.name', 'like', '%' . $conditions['c_user_name'] . '%');
        }

        // 品番（明細検索）
        if (!empty($conditions['c_item_number']) && $detailFk && Schema::hasTable($detailTable) && Schema::hasTable('m_items')) {
            $like = '%' . $conditions['c_item_number'] . '%';
            $query->whereExists(function ($sub) use ($detailTable, $detailFk, $like) {
                $sub->select(DB::raw(1))
                    ->from("{$detailTable} as details")
                    ->join('m_items as items', 'details.item_id', '=', 'items.id')
                    ->whereRaw("details.{$detailFk} = sales.id")
                    ->where('items.code', 'like', $like);
            });
        }

        // 品名（明細検索）
        if (!empty($conditions['c_name']) && $detailFk && Schema::hasTable($detailTable) && Schema::hasTable('m_items')) {
            $like = '%' . $conditions['c_name'] . '%';
            $query->whereExists(function ($sub) use ($detailTable, $detailFk, $like) {
                $sub->select(DB::raw(1))
                    ->from("{$detailTable} as details")
                    ->join('m_items as items', 'details.item_id', '=', 'items.id')
                    ->whereRaw("details.{$detailFk} = sales.id")
                    ->where('items.name', 'like', $like);
            });
        }

        if (!empty($conditions['c_order_no'])) {
            $query->where('sales.order_no', 'like', '%' . $conditions['c_order_no'] . '%');
        }

        $query->orderByDesc('sales.sales_at')
              ->orderByDesc('sales.id');

        $perPage = (int)($conditions['per_page'] ?? 50);
        $page    = (int)($conditions['page'] ?? 1);

        $total = (clone $query)->count();
        $rows  = $query->forPage($page, $perPage)->get();

        return [
            'rows'  => $rows,
            'pager' => [
                'total'        => $total,
                'per_page'     => $perPage,
                'current_page' => $page,
                'last_page'    => (int)ceil($total / max($perPage, 1)),
            ],
        ];
    }
}
