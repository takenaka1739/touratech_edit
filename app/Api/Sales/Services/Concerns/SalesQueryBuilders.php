<?php

namespace App\Api\Sales\Services\Concerns;

use App\Base\Models\Sales;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

trait SalesQueryBuilders
{
    /**
     * 一覧用クエリ（customer_name / user_name / has_invoice を旧版同様に返す）
     */
    private function buildListQuery(array $cond)
    {
        $salesDateCol = $this->salesDateColumn();

        $q = Sales::query()->from('t_sales')
            ->select([
                't_sales.id',
                DB::raw("t_sales.{$salesDateCol} as sales_date"),
                DB::raw($this->selectCustomerNameExpr() . ' as customer_name'),
                't_sales.total_amount',
                DB::raw($this->selectUserNameExpr() . ' as user_name'),
                DB::raw($this->existsInvoiceExpr() . ' as has_invoice'),
            ]);

        $q = $this->applyListJoins($q);
        $q = $this->setCondition($q, $cond);

        return $q;
    }

    /**
     * 旧版の setCondition を、現行テーブルに合わせて再実装
     */
    private function setCondition($query, array $cond)
    {
        $cond = new Collection($cond);

        $salesDateCol = $this->salesDateColumn();

        // キーワード（customer_name / user_name）
        $c_keyword = $cond->get('c_keyword');
        if ($c_keyword !== null && $c_keyword !== '') {
            $keywords = preg_split('/\s+/', trim($c_keyword));
            foreach ($keywords as $key) {
                $query->where(function ($q) use ($key) {
                    $like = '%' . escape_like($key) . '%';
                    $q->whereRaw($this->selectCustomerNameExpr() . " like ?", [$like])
                        ->orWhereRaw($this->selectUserNameExpr() . " like ?", [$like]);
                });
            }
        }

        // 売上日FROM/TO
        $from = $cond->get('c_sales_date_from');
        if ($from) {
            $query->where("t_sales.{$salesDateCol}", '>=', $from);
        }
        $to = $cond->get('c_sales_date_to');
        if ($to) {
            $query->where("t_sales.{$salesDateCol}", '<=', $to);
        }

        // 得意先名
        $c_customer_name = $cond->get('c_customer_name');
        if ($c_customer_name) {
            $like = '%' . escape_like($c_customer_name) . '%';
            $query->whereRaw($this->selectCustomerNameExpr() . " like ?", [$like]);
        }

        // 担当者名
        $c_user_name = $cond->get('c_user_name');
        if ($c_user_name) {
            $like = '%' . escape_like($c_user_name) . '%';
            $query->whereRaw($this->selectUserNameExpr() . " like ?", [$like]);
        }

        // 商品番号（明細）
        $c_item_number = $cond->get('c_item_number');
        if ($c_item_number) {
            $like = '%' . escape_like($c_item_number) . '%';
            $detailTable = $this->salesDetailTable();
            $query->whereExists(function ($q) use ($detailTable, $like) {
                $q->select(DB::raw(1))
                    ->from($detailTable . ' as d')
                    ->whereRaw('d.sale_id = t_sales.id')
                    ->whereIn('d.item_kind', [1, 2, 3])
                    ->where(function ($qq) use ($like) {
                        if ($this->hasColumnSafe($this->salesDetailTable(), 'item_number')) {
                            $qq->where('d.item_number', 'like', $like);
                        } else {
                            $qq->whereRaw('1=0');
                        }
                    });
            });
        }

        // 商品名（明細）
        $c_name = $cond->get('c_name');
        if ($c_name) {
            $like = '%' . escape_like($c_name) . '%';
            $detailTable = $this->salesDetailTable();
            $query->whereExists(function ($q) use ($detailTable, $like) {
                $q->select(DB::raw(1))
                    ->from($detailTable . ' as d')
                    ->whereRaw('d.sale_id = t_sales.id')
                    ->whereIn('d.item_kind', [1, 2, 3])
                    ->where(function ($qq) use ($like) {
                        if ($this->hasColumnSafe($this->salesDetailTable(), 'item_name')) {
                            $qq->where('d.item_name', 'like', $like);
                        }
                        if ($this->hasColumnSafe($this->salesDetailTable(), 'item_name_jp')) {
                            $qq->orWhere('d.item_name_jp', 'like', $like);
                        }
                    });
            });
        }

        // 受注番号
        $c_order_no = $cond->get('c_order_no');
        if ($c_order_no) {
            $query->where('t_sales.order_no', 'like', '%' . escape_like($c_order_no) . '%');
        }

        return $query;
    }

    private function selectCustomerNameExpr(): string
    {
        $ct = $this->resolveCustomerTable();
        if ($ct && $this->hasColumnSafe($ct, 'name')) {
            return "COALESCE(c.name, '')";
        }
        if ($this->hasColumnSafe('t_sales', 'customer_name')) {
            return "COALESCE(t_sales.customer_name, '')";
        }
        return "''";
    }

    private function selectUserNameExpr(): string
    {
        $ut = $this->resolveUserTable();
        if (!$ut) return "''";

        if ($ut === 'm_personnels') {
            return "COALESCE(u.name, '')";
        }
        return "COALESCE(u.name, '')";
    }

    private function existsInvoiceExpr(): string
    {
        $tbl = $this->invoiceLinkTable();
        if (!$tbl) return "0";
        return "EXISTS(SELECT 1 FROM {$tbl} x WHERE x.sales_id = t_sales.id)";
    }

    private function selectReceiveOrderIdExpr(): string
    {
        $tbl = $this->receiveOrderSalesLinkTable();
        if (!$tbl) return "NULL";
        return "(SELECT r.receive_order_id FROM {$tbl} r WHERE r.sales_id = t_sales.id LIMIT 1)";
    }

    private function applyListJoins($q)
    {
        $ct = $this->resolveCustomerTable();
        if ($ct && $this->hasColumnSafe($ct, 'id')) {
            $q->leftJoin("{$ct} as c", 'c.id', '=', 't_sales.customer_id');
        }

        $ut = $this->resolveUserTable();
        if ($ut) {
            if ($ut === 'm_personnels') {
                if ($this->hasColumnSafe('t_sales', 'personnel_id')) {
                    $q->leftJoin("{$ut} as u", 'u.id', '=', 't_sales.personnel_id');
                } elseif ($this->hasColumnSafe('t_sales', 'user_id')) {
                    $q->leftJoin("{$ut} as u", 'u.id', '=', 't_sales.user_id');
                }
            } else {
                if ($this->hasColumnSafe('t_sales', 'user_id')) {
                    $q->leftJoin("{$ut} as u", 'u.id', '=', 't_sales.user_id');
                } elseif ($this->hasColumnSafe('t_sales', 'personnel_id')) {
                    $q->leftJoin("{$ut} as u", 'u.id', '=', 't_sales.personnel_id');
                }
            }
        }

        return $q;
    }

    private function applyDetailJoins($q)
    {
        return $this->applyListJoins($q);
    }
}
