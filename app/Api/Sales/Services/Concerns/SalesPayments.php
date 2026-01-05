<?php

namespace App\Api\Sales\Services\Concerns;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * SalesPayments
 *
 * 目的:
 * - 売上ヘッダ(t_sales)の payment_id を確定するための補助ロジックを提供する。
 * - 旧画面/現行画面では「法人/個人（corporate_class）」の選択が存在するが、
 *   t_sales 側に corporate_class カラムを持たない構造の場合、
 *   corporate_class は payment_id（m_payments.method_code）で表現する運用になる。
 *
 * この trait が担うこと:
 * 1) corporate_class → payment_id 変換（resolvePaymentId）
 * 2) payment_id → corporate_class 逆変換（resolveCorporateClassByPaymentId）
 *
 * 前提テーブル:
 * - m_payments
 *   - id
 *   - method_code（ここに corporate_class 相当の値が入る想定）
 *   - deleted_at（SoftDelete の可能性があるため条件に含める）
 *
 * 使いどころ:
 * - SalesPersistence::fillSalesHeader()
 *   - payment_id が入力に無い場合に resolvePaymentId() で補完する
 * - SalesService::get()
 *   - t_sales.payment_id から corporate_class を復元し、フロントのラジオ表示に使う
 */
trait SalesPayments
{
    /**
     * corporate_class から payment_id を解決する。
     *
     * 想定仕様:
     * - m_payments.method_code に corporate_class を文字列で格納している
     *   例) corporate_class=1 → method_code="1"
     *
     * 解決手順:
     * 1) m_payments が無ければ null（環境差の保険）
     * 2) deleted_at があれば whereNull(deleted_at)
     * 3) corporateClass が指定され、method_code 列があるなら method_code 一致で先頭の id を返す
     * 4) 取得できなければフォールバックとして「最小id」を返す（旧版互換の保険）
     *
     * 注意:
     * - method_code がユニークである保証はここでは置かない（DB設計に依存）。
     * - フォールバックは「壊れないこと」優先。業務的に妥当かは運用で担保する。
     */
    private function resolvePaymentId(?int $corporateClass): ?int
    {
        if (!Schema::hasTable('m_payments')) {
            return null;
        }

        $base = DB::table('m_payments');

        // SoftDelete 対応
        if ($this->hasColumnSafe('m_payments', 'deleted_at')) {
            $base->whereNull('deleted_at');
        }

        // corporate_class が指定されているなら method_code 一致を優先
        if ($corporateClass !== null && $this->hasColumnSafe('m_payments', 'method_code')) {
            $id = (clone $base)
                ->where('method_code', (string)$corporateClass)
                ->value('id');

            if ($id) return (int)$id;
        }

        // フォールバック（最小id）
        $fallback = (clone $base)->orderBy('id')->value('id');
        return $fallback ? (int)$fallback : null;
    }

    /**
     * payment_id から corporate_class を逆引きする。
     *
     * 目的:
     * - 売上編集画面で corporate_class ラジオを復元するため、
     *   t_sales.payment_id → m_payments.method_code → corporate_class(int) に変換する。
     *
     * 解決手順:
     * 1) paymentId が空なら null
     * 2) m_payments が無ければ null
     * 3) deleted_at があれば whereNull(deleted_at)
     * 4) method_code が無ければ null（環境差）
     * 5) method_code を取得し int にキャストして返す
     *
     * 注意:
     * - method_code が "法人" 等の文字列の場合は int キャストが 0 になるので、
     *   その設計のDBではこの運用自体が成立しない（その場合は別ロジックが必要）。
     */
    private function resolveCorporateClassByPaymentId(?int $paymentId): ?int
    {
        if (!$paymentId) return null;
        if (!Schema::hasTable('m_payments')) return null;

        $q = DB::table('m_payments')->where('id', (int)$paymentId);

        // SoftDelete 対応
        if ($this->hasColumnSafe('m_payments', 'deleted_at')) {
            $q->whereNull('deleted_at');
        }

        // method_code が無い環境では復元不能
        if (!$this->hasColumnSafe('m_payments', 'method_code')) {
            return null;
        }

        $code = $q->value('method_code'); // 文字列想定（"1","2"...）
        if ($code === null || $code === '') return null;

        return (int)$code;
    }
}
