<?php

namespace App\Api\info\Services;

use App\Base\Models\Infoposts;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class InfoService
{
    /**
     * 種別ごとの一覧取得
     *
     * @param string $type       'shop' | 'product'
     * @param bool   $onlyPublic 公開中のみ（予約・期限考慮）
     * @param int    $limit      0以下で全件（安全のため最大1000件に丸め）
     * @return array<array<string,mixed>>  フロント互換のDTO配列
     */
    public function listByType(string $type, bool $onlyPublic = false, int $limit = 0): array
    {
        $q = Infoposts::query()->type($type);

        if ($onlyPublic) {
            $q->PublishedAndVisibleNow();
        }

        $q->ListOrder();

        if ($limit > 0) {
            $q->limit(min($limit, 1000));
        }

        $rows = $q->get();

        return $this->toDtoList($rows);
    }

    /**
     * 作成
     *
     * 既存フロント互換として、payloadの `body` は body_md に格納。
     * `published_at` 未指定時は now()、`status` 未指定時は 'published' とする。
     */
    public function create(string $type, array $payload, ?int $userId = null): array
    {
        $data = $this->normalizePayloadForWrite($payload, true);

        $post = new Infoposts();
        $post->fill($data + [
            'type'       => $type,
            'author_id'  => $userId,
            'updated_by' => $userId,
        ]);

        // 既存UIは公開運用を想定 → 明示がなければ公開扱い
        if (empty($post->status)) {
            $post->status = Infoposts::STATUS_PUBLISHED;
        }
        // 公開日が未指定なら「今」にする（フロントで空の場合でも受け入れ）
        if (empty($post->published_at)) {
            $post->published_at = now();
        }

        $post->save();

        return $this->toDto($post);
    }

    /**
     * 更新
     */
    public function update(string $type, int $id, array $payload, ?int $userId = null): array
    {
        /** @var Infoposts $post */
        $post = Infoposts::query()
            ->where('type', $type)
            ->findOrFail($id);

        $data = $this->normalizePayloadForWrite($payload, false);
        $data['updated_by'] = $userId;

        $post->fill($data);
        $post->save();

        return $this->toDto($post);
    }

    /**
     * 削除（ソフトデリート）
     */
    public function delete(string $type, int $id, ?int $userId = null): void
    {
        $post = Infoposts::query()
            ->where('type', $type)
            ->findOrFail($id);

        $post->delete();
    }

    /***************************************************************************
     * 内部：DTO / 正規化
     ***************************************************************************/

    /**
     * Eloquent → フロント互換DTO
     * - body: body_md 優先（なければ body_html をテキスト化して返す）
     * - published_at: 'Y-m-d'
     * - meta: array（external_url を含む）
     */
    protected function toDto(Infoposts $m): array
    {
        // body_html しかない場合はタグを軽く除去（最低限）
        $body = $m->body_md ?? null;
        if ($body === null && $m->body_html) {
            $body = trim(strip_tags((string)$m->body_html));
        }

        // メタは array に正規化（DBに文字列JSONで入っている場合も吸収）
        $meta = is_array($m->meta)
            ? $m->meta
            : (is_string($m->meta) ? (json_decode($m->meta, true) ?: []) : []);

        return [
            'id'            => $m->id,
            'published_at'  => optional($m->published_at)->toDateString() ?? '',
            'title'         => (string)$m->title,
            'body'          => (string)($body ?? ''),
            'status'        => $m->status,
            'is_pinned'     => (bool)$m->is_pinned,
            'priority'      => (int)$m->priority,
            'visible_from'  => optional($m->visible_from)->toDateTimeString(),
            'visible_until' => optional($m->visible_until)->toDateTimeString(),
            'related_product_id' => $m->related_product_id,
            'meta'          => $meta, // ★ フロントの external_url 用に返却
        ];
    }

    /**
     * 複数 → DTO配列
     * @param \Illuminate\Support\Collection<int,Infoposts> $rows
     * @return array<int,array<string,mixed>>
     */
    protected function toDtoList(Collection $rows): array
    {
        return $rows->map(fn (Infoposts $m) => $this->toDto($m))->all();
    }

    /**
     * フロントからの簡易payloadをDB項目へ正規化
     * - body → body_md
     * - published_at は date/datetime 文字列を Carbon 化（空は除外）
     * - meta.external_url は meta 配列に束ねる
     */
    protected function normalizePayloadForWrite(array $payload, bool $isCreate): array
    {
        $out = [];

        // タイトル・本文
        if (array_key_exists('title', $payload)) {
            $out['title'] = (string)$payload['title'];
        }
        if (array_key_exists('body', $payload)) {
            $out['body_md'] = (string)$payload['body'];
        }

        // 公開状態
        if (!empty($payload['status'])) {
            $out['status'] = (string)$payload['status'];
        }
        if (array_key_exists('is_pinned', $payload)) {
            $out['is_pinned'] = (bool)$payload['is_pinned'];
        }
        if (array_key_exists('priority', $payload)) {
            $out['priority'] = (int)$payload['priority'];
        }

        // 日付系
        foreach (['published_at', 'visible_from', 'visible_until', 'pin_until'] as $key) {
            if (!empty($payload[$key])) {
                $out[$key] = Carbon::parse($payload[$key]);
            }
        }

        // 関連商品
        if (array_key_exists('related_product_id', $payload)) {
            $out['related_product_id'] = $payload['related_product_id'] ? (int)$payload['related_product_id'] : null;
        }

        // メタ
        // - 配列が来ていればそのまま
        // - external_url 単体でも取り込む
        $meta = [];
        if (isset($payload['meta']) && is_array($payload['meta'])) {
            $meta = $payload['meta'];
        }
        if (isset($payload['meta']['external_url'])) {
            $url = trim((string)$payload['meta']['external_url']);
            $meta['external_url'] = $url;
        }
        if (!empty($meta)) {
            $out['meta'] = $meta;
        }

        return $out;
        }
}
