<?php

namespace App\Api\Sales\Services\Concerns;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

trait SalesPayments
{
    private function resolvePaymentId(?int $corporateClass): ?int
    {
        if (!Schema::hasTable('m_payments')) {
            return null;
        }

        $base = DB::table('m_payments');
        if ($this->hasColumnSafe('m_payments', 'deleted_at')) {
            $base->whereNull('deleted_at');
        }

        if ($corporateClass !== null && $this->hasColumnSafe('m_payments', 'method_code')) {
            $id = (clone $base)
                ->where('method_code', (string)$corporateClass)
                ->value('id');

            if ($id) return (int)$id;
        }

        $fallback = (clone $base)->orderBy('id')->value('id');
        return $fallback ? (int)$fallback : null;
    }

    private function resolveCorporateClassByPaymentId(?int $paymentId): ?int
    {
        if (!$paymentId) return null;
        if (!Schema::hasTable('m_payments')) return null;

        $q = DB::table('m_payments')->where('id', (int)$paymentId);

        if ($this->hasColumnSafe('m_payments', 'deleted_at')) {
            $q->whereNull('deleted_at');
        }

        if (!$this->hasColumnSafe('m_payments', 'method_code')) {
            return null;
        }

        $code = $q->value('method_code'); // string想定
        if ($code === null || $code === '') return null;

        return (int)$code;
    }
}
