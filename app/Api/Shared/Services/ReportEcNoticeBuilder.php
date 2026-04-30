<?php

namespace App\Api\Shared\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ReportEcNoticeBuilder
{
    public function buildForReceiveOrderId(?int $receiveOrderId, array $fallback = []): array
    {
        if (!$receiveOrderId) {
            return $this->build($fallback);
        }

        $row = DB::table('t_receive_orders')->where('id', $receiveOrderId)->first();
        if (!$row) {
            return $this->build($fallback);
        }

        return $this->build(array_merge($fallback, (array) $row));
    }

    public function buildForSales(array $salesData): array
    {
        $receiveOrderId = (int)($salesData['receive_order_id'] ?? 0);
        if ($receiveOrderId > 0) {
            return $this->buildForReceiveOrderId($receiveOrderId, $salesData);
        }

        return $this->build($salesData);
    }

    public function build(array $data): array
    {
        $d = new Collection($data);
        if (!$this->isEcOrder($d)) {
            return [];
        }

        $lines = ['サイトからの購入'];

        $salesForm = $this->salesFormLabel($d->get('sales_form'));
        if ($salesForm !== '') {
            $lines[] = '購入端末: ' . $salesForm;
        }

        $orderNo = trim((string)$d->get('order_no', ''));
        if ($orderNo !== '') {
            $lines[] = '注文番号: ' . $orderNo;
        }

        if ((int)($d->get('customer_id') ?? 0) === 0) {
            $lines[] = '顧客区分: ゲスト';
        }

        $address = $this->formatAddress($d);
        if ($address !== '') {
            $lines[] = '届け先: ' . $address;
        }

        if (Schema::hasColumn('t_receive_orders', 'use_points') || $d->has('use_points')) {
            $usePoints = (int)($d->get('use_points') ?? 0);
            $lines[] = 'ポイント利用: ' . ($usePoints > 0 ? number_format($usePoints) . 'pt' : 'なし');
        }

        $squarePaymentId = trim((string)$d->get('square_payment_id', ''));
        if ($squarePaymentId !== '') {
            $status = trim((string)$d->get('square_status', ''));
            $lines[] = 'カード決済: Square' . ($status !== '' ? ' / ' . $status : '');
        }

        return $lines;
    }

    private function isEcOrder(Collection $d): bool
    {
        if ($this->salesFormLabel($d->get('sales_form')) !== '') {
            return true;
        }

        if (trim((string)$d->get('order_no', '')) !== '') {
            return true;
        }

        if (trim((string)$d->get('mail_snapshot', '')) !== '') {
            return true;
        }

        if (trim((string)$d->get('square_payment_id', '')) !== '') {
            return true;
        }

        if ($d->has('use_points') && $d->get('use_points') !== null) {
            return true;
        }

        return false;
    }

    private function formatAddress(Collection $d): string
    {
        $parts = [];

        $zip = trim((string)$d->get('zip_code', ''));
        if ($zip !== '') {
            $parts[] = '〒' . $zip;
        }

        foreach (['address1', 'address2'] as $key) {
            $value = trim((string)$d->get($key, ''));
            if ($value !== '') {
                $parts[] = $value;
            }
        }

        $name = trim((string)$d->get('name', ''));
        if ($name !== '') {
            $parts[] = $name;
        }

        $tel = trim((string)$d->get('tel', ''));
        if ($tel !== '') {
            $parts[] = 'TEL ' . $tel;
        }

        return implode(' ', $parts);
    }

    private function salesFormLabel($value): string
    {
        $n = (int)($value ?? 0);
        return match ($n) {
            1 => 'PC',
            2 => 'スマフォ',
            3 => 'タブレット',
            default => '',
        };
    }
}
