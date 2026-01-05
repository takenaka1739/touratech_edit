<?php

namespace App\Api\Sales\Services\Concerns;

use App\Base\Models\Sales;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

trait SalesQueryBuilders
{
    /**
     * 一覧用クエリを組み立てる
     *
     * 目的:
     * - 売上一覧（検索画面）で必要な最小項目を返す
     * - 旧版互換として customer_name / user_name / has_invoice を派生カラムで返す
     *
     * 返却項目:
     * - t_sales.id
     * - sales_date（t_sales の「売上日カラム揺れ」を吸収して sales_date に統一）
     * - customer_name（customerテーブル join できるなら c.name / できないなら t_sales.customer_name 等）
     * - total_amount
     * - user_name（personnels/users の揺れを吸収）
     * - has_invoice（請求連結テーブルの存在判定）
     */
    private function buildListQuery(array $cond)
    {
        $salesDateCol = $this->salesDateColumn();

        $q = Sales::query()->from('t_sales')
            ->select([
                't_sales.id',

                // 一覧では常に sales_date という別名で返す（フロント側の表示/検索に統一利用）
                DB::raw("t_sales.{$salesDateCol} as sales_date"),

                // 得意先名（旧版互換）
                DB::raw($this->selectCustomerNameExpr() . ' as customer_name'),

                't_sales.total_amount',

                // 担当者名（旧版互換）
                DB::raw($this->selectUserNameExpr() . ' as user_name'),

                // 請求連結有無（旧版互換）
                DB::raw($this->existsInvoiceExpr() . ' as has_invoice'),
            ]);

        // customers / personnels(users) の join（環境差吸収）
        $q = $this->applyListJoins($q);

        // 検索条件適用（旧版 setCondition の再実装）
        $q = $this->setCondition($q, $cond);

        return $q;
    }

    /**
     * 旧版の setCondition を、現行テーブルに合わせて再実装
     *
     * 検索条件:
     * - c_keyword: customer_name / user_name の部分一致（スペース区切りAND）
     * - c_sales_date_from/to: 売上日範囲
     * - c_customer_name: 得意先名 部分一致
     * - c_user_name: 担当者名 部分一致
     * - c_item_number: 明細の商品番号 部分一致（exists）
     * - c_name: 明細の商品名/日本語名 部分一致（exists）
     * - c_order_no: 受注番号 部分一致
     *
     * 注意:
     * - escape_like() は既存ヘルパを利用（%/_ のエスケープ）
     * - 明細検索は whereExists を使い、一覧の join を肥大化させない
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

        // 売上日FROM/TO（salesDateColumn の揺れを吸収）
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
                        // item_number 列が存在する時のみ検索（存在しない環境はヒットなし）
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
                        // item_name / item_name_jp が存在するものだけ検索条件に含める
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

    /**
     * 得意先名のSQL式（環境差吸収）
     *
     * 優先順位:
     * 1) customers を join でき、name 列がある → c.name
     * 2) t_sales.customer_name がある → t_sales.customer_name
     * 3) それ以外 → ''
     */
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

    /**
     * 担当者名のSQL式（環境差吸収）
     *
     * - resolveUserTable() が返すテーブルを applyListJoins() で u として join 済み、という前提
     */
    private function selectUserNameExpr(): string
    {
        $ut = $this->resolveUserTable();
        if (!$ut) return "''";

        // 現状、m_personnels / users いずれも name 列を想定
        return "COALESCE(u.name, '')";
    }

    /**
     * 「請求連結が存在するか」のSQL式
     *
     * - 請求テーブル/連結テーブルが存在しない環境では常に 0
     */
    private function existsInvoiceExpr(): string
    {
        $tbl = $this->invoiceLinkTable();
        if (!$tbl) return "0";
        return "EXISTS(SELECT 1 FROM {$tbl} x WHERE x.sales_id = t_sales.id)";
    }

    /**
     * 紐づく受注IDのサブクエリ（一覧では使わないが詳細で利用）
     */
    private function selectReceiveOrderIdExpr(): string
    {
        $tbl = $this->receiveOrderSalesLinkTable();
        if (!$tbl) return "NULL";
        return "(SELECT r.receive_order_id FROM {$tbl} r WHERE r.sales_id = t_sales.id LIMIT 1)";
    }

    /**
     * 一覧用 join を適用する
     *
     * join 方針:
     * - customers は c として join（存在すれば）
     * - users/personnels は u として join（t_sales の personnel_id / user_id の揺れを吸収）
     */
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

    /**
     * 詳細取得用 join（現状は一覧と同じ）
     *
     * 将来:
     * - 詳細専用に別 join（例: 支払、請求、受注等）を増やしたくなったらここで分離する
     */
    private function applyDetailJoins($q)
    {
        return $this->applyListJoins($q);
    }
}
