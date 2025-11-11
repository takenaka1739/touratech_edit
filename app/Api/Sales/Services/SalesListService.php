<?php

namespace App\Api\Sales\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SalesListService
{
    /**
     * 売上一覧を取得する
     *
     * @param array $conditions 検索条件
     * @return array
     */
    public function getList(array $conditions): array
    {
        $query = DB::table('t_sales as sales')
            ->select([
                'sales.id',
                'sales.sales_at',
                'sales.total_amount',
                'sales.is_invoice_check as has_invoice',
                'customers.name as customer_name',
                'personnels.name as personnel_name',
            ])
            ->leftJoin('t_customers as customers', 'sales.customer_id', '=', 'customers.id')
            ->leftJoin('m_personnels as personnels', 'sales.personnel_id', '=', 'personnels.id');

        // 検索条件の適用
        if (!empty($conditions['c_sales_date_from'])) {
            $query->where('sales.sales_at', '>=', $conditions['c_sales_date_from']);
        }

        if (!empty($conditions['c_sales_date_to'])) {
            $query->where('sales.sales_at', '<=', $conditions['c_sales_date_to']);
        }

        if (!empty($conditions['c_customer_name'])) {
            $query->where('customers.name', 'like', '%' . $conditions['c_customer_name'] . '%');
        }

        if (!empty($conditions['c_user_name'])) {
            $query->where('personnels.name', 'like', '%' . $conditions['c_user_name'] . '%');
        }

        if (!empty($conditions['c_item_number'])) {
            $query->whereExists(function ($sub) use ($conditions) {
                $sub->select(DB::raw(1))
                    ->from('t_sales_details as details')
                    ->join('m_items as items', 'details.item_id', '=', 'm_items.id')
                    ->whereRaw('details.sales_id = sales.id')
                    ->where('items.code', 'like', '%' . $conditions['c_item_number'] . '%');
            });
        }

        if (!empty($conditions['c_name'])) {
            $query->whereExists(function ($sub) use ($conditions) {
                $sub->select(DB::raw(1))
                    ->from('t_sales_details as details')
                    ->join('m_items as items', 'details.item_id', '=', 'm_items.id')
                    ->whereRaw('details.sales_id = sales.id')
                    ->where('items.name', 'like', '%' . $conditions['c_name'] . '%');
            });
        }

        if (!empty($conditions['c_order_no'])) {
            $query->where('sales.order_no', 'like', '%' . $conditions['c_order_no'] . '%');
        }

        // 並び順とページネーション
        $query->orderByDesc('sales.sales_at')
              ->orderByDesc('sales.id');

        $perPage = $conditions['per_page'] ?? 50;
        $page = $conditions['page'] ?? 1;

        $total = $query->count();
        $rows = $query->forPage($page, $perPage)->get();

        return [
            'rows' => $rows,
            'pagination' => [
                'total' => $total,
                'per_page' => $perPage,
                'current_page' => $page,
            ],
        ];
    }
}
