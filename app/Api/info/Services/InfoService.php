<?php

namespace App\Api\info\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;

class InfoService
{
    /** @var string テーブル名 */
    private string $table = 't_info_posts';

    /**
     * 投稿一覧を取得
     *
     * @param string|null $type 'shop' | 'product' | null
     * @return \Illuminate\Support\Collection
     */
    public function getPosts(?string $type)
    {
        $query = DB::table($this->table)
            ->whereNull('deleted_at');

        if ($type) {
            $query->where('type', $type);
        }

        $rows = $query
            ->orderByDesc('is_pinned')
            ->orderByDesc('priority')
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->get([
                'id',
                'type',
                'status',
                'title',
                'slug',
                'excerpt',
                'body_md',
                'body_html',
                'cover_image_id',
                'published_at',
                'visible_from',
                'visible_until',
                'is_pinned',
                'pin_until',
                'priority',
                'related_product_id',
                'author_id',
                'updated_by',
                'meta',
                'created_at',
                'updated_at',
            ]);

        // meta(JSON) を array に変換して返す
        return $rows->map(function ($row) {
            if (isset($row->meta) && $row->meta !== null && $row->meta !== '') {
                $decoded = json_decode($row->meta, true);
                $row->meta = $decoded ?? null;
            } else {
                $row->meta = null;
            }
            return $row;
        });
    }

    /**
     * 投稿を1件作成
     *
     * @param array $data validated data from InfoRequest
     * @return object|null
     */
    public function createPost(array $data)
    {
        $now    = Carbon::now();
        $userId = optional(auth()->user())->id;

        // A案: status=published かつ published_at 未指定なら即時公開扱いで now をセット
        if (($data['status'] ?? null) === 'published' && empty($data['published_at'])) {
            $data['published_at'] = $now->toDateTimeString();
        }

        $insert = $this->buildSaveColumns($data);
        $insert['author_id']  = $userId;
        $insert['updated_by'] = $userId;
        $insert['created_at'] = $now->toDateTimeString();
        $insert['updated_at'] = $now->toDateTimeString();

        $id = DB::table($this->table)->insertGetId($insert);

        Log::info('[InfoService][createPost] created', [
            'id' => $id,
        ]);

        return $this->findPost($id);
    }

    /**
     * 投稿を1件更新
     *
     * @param int   $id
     * @param array $data
     * @return object|null
     */
    public function updatePost(int $id, array $data)
    {
        $now    = Carbon::now();
        $userId = optional(auth()->user())->id;

        if (($data['status'] ?? null) === 'published' && empty($data['published_at'])) {
            $data['published_at'] = $now->toDateTimeString();
        }

        $update = $this->buildSaveColumns($data);
        $update['updated_by'] = $userId;
        $update['updated_at'] = $now->toDateTimeString();

        DB::table($this->table)
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->update($update);

        Log::info('[InfoService][updatePost] updated', [
            'id' => $id,
        ]);

        return $this->findPost($id);
    }

    /**
     * 投稿をソフトデリート
     *
     * @param int $id
     * @return void
     */
    public function deletePost(int $id): void
    {
        $now    = Carbon::now();
        $userId = optional(auth()->user())->id;

        DB::table($this->table)
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->update([
                'deleted_at' => $now->toDateTimeString(),
                'updated_by' => $userId,
                'updated_at' => $now->toDateTimeString(),
            ]);

        Log::info('[InfoService][deletePost] soft-deleted', [
            'id' => $id,
        ]);
    }

    /**
     * 商品検索（Items 用モーダル）
     *
     * @param string|null $keyword
     * @param int         $page
     * @return array { rows: […], pager: { page, lastPage, total } }
     */
    public function searchItems(?string $keyword, int $page = 1): array
    {
        $perPage = 20;

        $query = DB::table('m_items')
            ->whereNull('deleted_at');

        if ($keyword) {
            $like = '%' . $keyword . '%';
            $query->where(function ($q) use ($like) {
                $q->where('name', 'like', $like)
                    ->orWhere('item_number', 'like', $like)
                    ->orWhere('code', 'like', $like);
            });
        }

        $total = $query->count();
        $page  = max(1, $page);
        $lastPage = max(1, (int)ceil($total / $perPage));

        $rows = $query
            ->orderBy('id', 'desc')
            ->forPage($page, $perPage)
            ->get([
                'id',
                'name',
                'code',
                'item_number',
            ])
            ->map(function ($row) {
                // フロントで扱いやすいように整形
                return [
                    'id'   => $row->id,
                    'name' => $row->name,
                    // 品番かコードか、どちらかあれば補足情報として返す
                    'code' => $row->item_number ?: $row->code,
                ];
            })
            ->values()
            ->all();

        return [
            'rows'  => $rows,
            'pager' => [
                'page'     => $page,
                'lastPage' => $lastPage,
                'total'    => $total,
            ],
        ];
    }

    /**
     * カテゴリ検索（カテゴリそのものを選択するため）
     *
     * @param string|null $keyword
     * @param string|null $parentCode
     * @return array [ { code, name }, … ]
     */
    public function searchCategories(?string $keyword, ?string $parentCode): array
    {
        $query = DB::table('m_categories')
            ->whereNull('deleted_at')
            ->where('is_display', 1);

        if ($parentCode) {
            $query->where('parent_code', $parentCode);
        }

        if ($keyword) {
            $like = '%' . $keyword . '%';
            $query->where(function ($q) use ($like) {
                $q->where('name', 'like', $like)
                    ->orWhere('code', 'like', $like);
            });
        }

        $rows = $query
            ->orderBy('parent_code')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->limit(100)
            ->get([
                'code',
                'parent_code',
                'name',
                'url',
            ])
            ->map(function ($row) {
                return [
                    'code'        => $row->code,
                    'parent_code' => $row->parent_code,
                    'name'        => $row->name,
                    // 将来的にリンク生成に使えるように url も返しておく
                    'url'         => $row->url,
                ];
            })
            ->values()
            ->all();

        return $rows;
    }

    // ==========================
    // 内部ユーティリティ
    // ==========================

    /**
     * 保存用カラムを組み立てる（未知のキーは無視）
     *
     * @param array $data
     * @return array
     */
    private function buildSaveColumns(array $data): array
    {
        // テーブルに存在する主なカラムだけを明示的に許可
        $allowed = [
            'type',
            'status',
            'title',
            'slug',
            'excerpt',
            'body_md',
            'body_html',
            'cover_image_id',
            'published_at',
            'visible_from',
            'visible_until',
            'is_pinned',
            'pin_until',
            'priority',
            'related_product_id',
            'meta',
        ];

        $save = [];

        foreach ($allowed as $key) {
            if (!array_key_exists($key, $data)) {
                continue;
            }

            $value = $data[$key];

            if ($key === 'meta') {
                // meta は array|null を JSON 文字列に変換して保存
                if (is_array($value) && !empty($value)) {
                    $save['meta'] = json_encode($value, JSON_UNESCAPED_UNICODE);
                } else {
                    $save['meta'] = null;
                }
                continue;
            }

            $save[$key] = $value;
        }

        // body_html は現時点では未使用なので null 固定（将来 Markdown パースで生成）
        if (!array_key_exists('body_html', $save)) {
            $save['body_html'] = null;
        }

        return $save;
    }

    /**
     * 1件取得して meta を array にデコードして返す
     *
     * @param int $id
     * @return object|null
     */
    private function findPost(int $id)
    {
        $row = DB::table($this->table)
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->first([
                'id',
                'type',
                'status',
                'title',
                'slug',
                'excerpt',
                'body_md',
                'body_html',
                'cover_image_id',
                'published_at',
                'visible_from',
                'visible_until',
                'is_pinned',
                'pin_until',
                'priority',
                'related_product_id',
                'author_id',
                'updated_by',
                'meta',
                'created_at',
                'updated_at',
            ]);

        if (!$row) {
            return null;
        }

        if (isset($row->meta) && $row->meta !== null && $row->meta !== '') {
            $decoded = json_decode($row->meta, true);
            $row->meta = $decoded ?? null;
        } else {
            $row->meta = null;
        }

        return $row;
    }
}
