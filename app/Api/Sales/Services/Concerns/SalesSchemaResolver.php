<?php

namespace App\Api\Sales\Services\Concerns;

use App\Base\Models\SalesDetail;
use Illuminate\Support\Facades\Schema;

/**
 * SalesSchemaResolver
 *
 * 目的:
 * - 環境差 / 旧版残骸 / テーブル定義の揺れを吸収し、SalesService が「固定名で扱える」ようにする。
 * - 「どのテーブル・どのカラムを使うか」を 1 箇所に集約して、サービス層の分岐を減らす。
 *
 * この trait が吸収している主な揺れ:
 * - 売上日カラム: t_sales.sales_at / t_sales.sales_date
 * - 売上明細テーブル名: モデル(SalesDetail)の $table 定義に追従
 * - 在庫カラム: m_items.domestic_stocks / m_items.domestic_stock
 * - 連結テーブル名: t_link_* 系 / link_* 系
 * - 得意先テーブル: t_customers / m_customers / customers
 * - 担当者テーブル: m_personnels / users
 *
 * 注意:
 * - hasColumnSafe() は Schema の例外も握りつぶすため、
 *   「存在しない扱い」になっても落ちないことを優先する（旧版互換・運用優先）。
 */
trait SalesSchemaResolver
{
    /**
     * 売上日カラム名を返す
     *
     * 背景:
     * - 現行仕様は t_sales.sales_at を使う想定
     * - 旧画面/旧コードは t_sales.sales_date を参照している可能性がある
     *
     * 方針:
     * - sales_at があれば sales_at
     * - なければ sales_date
     * - どちらもなければ sales_at（フォールバック）
     *
     * 使いどころ:
     * - 一覧の orderBy / select as sales_date
     * - 登録・更新時のヘッダ格納
     */
    private function salesDateColumn(): string
    {
        if ($this->hasColumnSafe('t_sales', 'sales_at')) return 'sales_at';
        if ($this->hasColumnSafe('t_sales', 'sales_date')) return 'sales_date';
        return 'sales_at';
    }

    /**
     * 売上明細テーブル名を返す
     *
     * 背景:
     * - 旧: sales_details 等、プロジェクトごとに名称が揺れる可能性がある
     * - 現行は SalesDetail モデルの $table を唯一の正として追従する
     *
     * 使いどころ:
     * - 一覧検索の whereExists（明細検索）
     * - 詳細取得の明細ロード
     * - 明細の削除/更新/登録
     */
    private function salesDetailTable(): string
    {
        $m = new SalesDetail();
        return $m->getTable();
    }

    /**
     * 売上明細テーブルが持つ売上ヘッダへの外部キー名を返す。
     */
    private function salesDetailSalesKeyColumn(): string
    {
        $detailTable = $this->salesDetailTable();

        if ($this->hasColumnSafe($detailTable, 'sale_id')) return 'sale_id';
        if ($this->hasColumnSafe($detailTable, 'sales_id')) return 'sales_id';

        return 'sale_id';
    }

    /**
     * 在庫カラム名を返す
     *
     * 要件:
     * - inventory_* は使わず m_items を直接参照して在庫増減を行う
     *
     * 方針:
     * - domestic_stocks があれば domestic_stocks
     * - なければ domestic_stock
     */
    private function itemStockColumn(): string
    {
        if ($this->hasColumnSafe('m_items', 'domestic_stocks')) return 'domestic_stocks';
        return 'domestic_stock';
    }

    /**
     * 受注-売上 連結テーブル名を返す
     *
     * 想定:
     * - t_link_r_order_sales（推奨/現行）
     * - link_r_order_sales（旧/別環境）
     *
     * 使いどころ:
     * - SalesService::get() の receive_order_id 派生
     * - 登録時の連結 insert
     * - 更新/削除時の参照/削除
     */
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

    /**
     * 受注明細-売上明細 連結テーブル名を返す
     *
     * 想定:
     * - t_link_r_order_sales_detail（推奨/現行）
     * - link_r_order_sales_detail（旧/別環境）
     *
     * 使いどころ:
     * - 受注から売上作成時の明細紐付け
     * - 売上削除時の連結解除
     */
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

    /**
     * 「受注に売上が存在するか」を保持するテーブル名を返す
     *
     * 想定:
     * - t_receive_order_has_sales（推奨/現行）
     * - receive_order_has_sales（旧/別環境）
     *
     * 使いどころ:
     * - updateHasSales() 等の受注ステータス更新（SalesReceiveOrderStatus 側）
     */
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

    /**
     * 売上-請求 連結テーブル名を返す
     *
     * 想定:
     * - t_link_sales_invoice（推奨/現行）
     * - link_sales_invoice（旧/別環境）
     *
     * 使いどころ:
     * - hasInvoice() / existsInvoiceExpr()
     * - 編集/削除の抑止判定
     */
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

    /**
     * Schema::hasTable / hasColumn を安全に呼ぶためのラッパ
     *
     * 方針:
     * - 例外が出た場合は false を返して処理継続（運用停止を避ける）
     *
     * 注意:
     * - 「本当はあるのに false になる」ケースも理論上あり得るが、
     *   その場合は周辺でフォールバックに落ちる設計にしている。
     */
    private function hasColumnSafe(string $table, string $column): bool
    {
        try {
            return Schema::hasTable($table) && Schema::hasColumn($table, $column);
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * 得意先テーブル名を解決する
     *
     * 想定:
     * - t_customers（推奨/現行）
     * - m_customers（旧）
     * - customers（Laravel標準）
     *
     * 使いどころ:
     * - 一覧/詳細で customer_name を join 取得する
     * - 編集時の補完（hydrateCustomerFieldsForEdit）
     */
    private function resolveCustomerTable(): ?string
    {
        foreach (['t_customers', 'm_customers', 'customers'] as $t) {
            if (Schema::hasTable($t)) return $t;
        }
        return null;
    }

    /**
     * 担当者（ユーザー）テーブル名を解決する
     *
     * 背景:
     * - 旧版は users
     * - 現行は m_personnels の可能性がある
     *
     * 使いどころ:
     * - 一覧/詳細で user_name（担当者名）を join 取得する
     */
    private function resolveUserTable(): ?string
    {
        foreach (['m_personnels', 'users'] as $t) {
            if (Schema::hasTable($t)) return $t;
        }
        return null;
    }
}
