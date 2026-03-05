<?php

namespace App\Api\ShopMail\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class MailTemplateService
{
    public function list(array $cond = []): array
    {
        $q = DB::table('m_mail_templates');

        if (Schema::hasColumn('m_mail_templates', 'deleted_at')) {
            $q->whereNull('deleted_at');
        }

        if (isset($cond['template_type']) && $cond['template_type'] !== '') {
            $q->where('template_type', (int)$cond['template_type']);
        }
        if (isset($cond['is_active']) && $cond['is_active'] !== '') {
            $q->where('is_active', (int)$cond['is_active']);
        }

        $rows = $q->select([
                'id',
                'template_type',
                'title',
                DB::raw('title as name'),
                'subject_template',
                'header_template',
                'footer_template',
                'detail_mode',
                'payment_url_enabled',
                'shipping_text',
                'is_active',
                'created_at',
                'updated_at',
            ])
            ->orderBy('id', 'desc')
            ->get();

        return ['rows' => $rows];
    }

    public function find(int $id): ?object
    {
        $q = DB::table('m_mail_templates')->where('id', $id);

        if (Schema::hasColumn('m_mail_templates', 'deleted_at')) {
            $q->whereNull('deleted_at');
        }

        return $q->first();
    }

    public function create(array $data): int
    {
        $now = now();

        return (int) DB::table('m_mail_templates')->insertGetId([
            'template_type'       => (int)$data['template_type'],
            'title'               => (string)$data['title'],
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
            'template_type','title','subject_template','header_template','footer_template',
            'detail_mode','payment_url_enabled','shipping_text','is_active',
        ] as $k) {
            if (array_key_exists($k, $data)) $row[$k] = $data[$k];
        }
        if (empty($row)) return;

        $row['updated_at'] = now();

        $q = DB::table('m_mail_templates')->where('id', $id);

        if (Schema::hasColumn('m_mail_templates', 'deleted_at')) {
            $q->whereNull('deleted_at');
        }

        $q->update($row);
    }

    public function delete(int $id): void
    {
        $q = DB::table('m_mail_templates')->where('id', $id);

        if (Schema::hasColumn('m_mail_templates', 'deleted_at')) {
            $q->whereNull('deleted_at')->update([
                'deleted_at' => now(),
                'updated_at' => now(),
            ]);
            return;
        }

        $q->delete();
    }

    public function getDetailSettings(): array
    {
        $q = DB::table('m_mail_detail_settings');

        if (Schema::hasColumn('m_mail_detail_settings', 'deleted_at')) {
            $q->whereNull('deleted_at');
        }

        // ✅ sort_order には依存しない（過去に Unknown column が出ているため）
        $rows = $q->orderBy('id')->get();

        return ['rows' => $rows];
    }

    public function updateDetailSettings(array $rows): void
    {
        $now = now();

        // ✅ キー列（環境差吸収）
        // あなたの環境では field_key が本命なので最優先で見る
        $keyCol = null;
        foreach (['field_key', 'key_name', 'item_key', 'code', 'key'] as $candidate) {
            if (Schema::hasColumn('m_mail_detail_settings', $candidate)) {
                $keyCol = $candidate;
                break;
            }
        }

        $hasDisplayMode = Schema::hasColumn('m_mail_detail_settings', 'display_mode');
        $hasIsDisplay   = Schema::hasColumn('m_mail_detail_settings', 'is_display');

        DB::transaction(function () use ($rows, $now, $keyCol, $hasDisplayMode, $hasIsDisplay) {
            foreach ($rows as $r) {
                if (!is_array($r)) continue;

                $update = [];

                if (array_key_exists('display_label', $r)) {
                    $update['display_label'] = (string)$r['display_label'];
                }

                // display_mode があるなら優先で保存
                if ($hasDisplayMode && array_key_exists('display_mode', $r)) {
                    $update['display_mode'] = (int)$r['display_mode'];
                }

                // is_display は互換のため（display_mode が無い環境向け）
                if ($hasIsDisplay && array_key_exists('is_display', $r)) {
                    // 元実装の !! キャストは 2 などが 1 になるので、数値として扱う
                    $update['is_display'] = (int)$r['is_display'] ? 1 : 0;
                } elseif ($hasIsDisplay && $hasDisplayMode && array_key_exists('display_mode', $r)) {
                    $update['is_display'] = ((int)$r['display_mode'] === 0) ? 0 : 1;
                }

                if (empty($update)) continue;
                $update['updated_at'] = $now;

                $id = isset($r['id']) && $r['id'] !== '' ? (int)$r['id'] : null;

                // ① id があれば id 優先で更新
                if ($id) {
                    $q = DB::table('m_mail_detail_settings')->where('id', $id);
                    if (Schema::hasColumn('m_mail_detail_settings', 'deleted_at')) {
                        $q->whereNull('deleted_at');
                    }
                    $q->update($update);
                    continue;
                }

                // ② id が無い場合はキー列で upsert
                if (!$keyCol) continue;

                $keyVal = (string)(
                    $r[$keyCol]
                    ?? $r['field_key']
                    ?? $r['key_name']
                    ?? $r['item_key']
                    ?? $r['code']
                    ?? $r['key']
                    ?? ''
                );
                $keyVal = trim($keyVal);
                if ($keyVal === '') continue;

                // deleted_at がある場合でも「同じ key が存在するなら更新したい」ので、
                // ここでは deleted_at を条件に含めずに拾う（復活運用にする）
                $exists = DB::table('m_mail_detail_settings')
                    ->where($keyCol, $keyVal)
                    ->first();

                if ($exists) {
                    DB::table('m_mail_detail_settings')
                        ->where('id', (int)$exists->id)
                        ->update(array_merge($update, [
                            // soft delete復活
                            ...(Schema::hasColumn('m_mail_detail_settings', 'deleted_at') ? ['deleted_at' => null] : []),
                        ]));
                } else {
                    $insert = array_merge($update, [
                        $keyCol      => $keyVal,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);

                    // sort_order は無い前提（あっても不要）
                    DB::table('m_mail_detail_settings')->insert($insert);
                }
            }
        });
    }
}
