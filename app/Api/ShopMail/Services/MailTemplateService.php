<?php

namespace App\Api\ShopMail\Services;

use Illuminate\Support\Facades\DB;

class MailTemplateService
{
    public function list(array $cond = []): array
    {
        $q = DB::table('m_mail_templates')->whereNull('deleted_at');

        if (isset($cond['template_type']) && $cond['template_type'] !== '') {
            $q->where('template_type', (int)$cond['template_type']);
        }
        if (isset($cond['is_active']) && $cond['is_active'] !== '') {
            $q->where('is_active', (int)$cond['is_active']);
        }

        $rows = $q->orderBy('id', 'desc')->get();

        return ['rows' => $rows];
    }

    public function find(int $id): ?object
    {
        return DB::table('m_mail_templates')
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->first();
    }

    public function create(array $data): int
    {
        $now = now();
        return (int) DB::table('m_mail_templates')->insertGetId([
            'template_type'       => (int)$data['template_type'],
            'name'                => (string)$data['name'],
            'subject_template'    => (string)$data['subject_template'],
            'header_template'     => (string)($data['header_template'] ?? ''),
            'footer_template'     => (string)($data['footer_template'] ?? ''),
            'detail_mode'         => (int)($data['detail_mode'] ?? 0),
            'payment_url_enabled' => (int)($data['payment_url_enabled'] ?? 0),
            'shipping_text'       => (string)($data['shipping_text'] ?? ''),
            'is_active'           => (int)($data['is_active'] ?? 1),
            'created_at'          => $now,
            'updated_at'          => $now,
        ]);
    }

    public function update(int $id, array $data): void
    {
        $row = [];
        foreach ([
            'template_type', 'name', 'subject_template', 'header_template', 'footer_template',
            'detail_mode', 'payment_url_enabled', 'shipping_text', 'is_active',
        ] as $k) {
            if (array_key_exists($k, $data)) {
                $row[$k] = $data[$k];
            }
        }

        if (empty($row)) return;

        $row['updated_at'] = now();

        DB::table('m_mail_templates')
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->update($row);
    }

    public function delete(int $id): void
    {
        DB::table('m_mail_templates')
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->update([
                'deleted_at' => now(),
                'updated_at' => now(),
            ]);
    }

    public function getDetailSettings(): array
    {
        $rows = DB::table('m_mail_detail_settings')
            ->whereNull('deleted_at')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return ['rows' => $rows];
    }

    /**
     * 画面から「表示名・表示/非表示」などを一括更新
     * payload 例:
     * [
     *   ['id'=>1,'display_label'=>'ご注文番号','is_display'=>1],
     *   ...
     * ]
     */
    public function updateDetailSettings(array $rows): void
    {
        $now = now();

        DB::transaction(function () use ($rows, $now) {
            foreach ($rows as $r) {
                if (empty($r['id'])) continue;

                $update = [];
                if (array_key_exists('display_label', $r)) $update['display_label'] = (string)$r['display_label'];
                if (array_key_exists('is_display', $r)) $update['is_display'] = (int)(!!$r['is_display']);

                if (empty($update)) continue;

                $update['updated_at'] = $now;

                DB::table('m_mail_detail_settings')
                    ->where('id', (int)$r['id'])
                    ->whereNull('deleted_at')
                    ->update($update);
            }
        });
    }
}
