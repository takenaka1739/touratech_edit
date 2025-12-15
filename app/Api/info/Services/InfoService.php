<?php

namespace App\Api\info\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;

class InfoService
{
    /** @var string テーブル名 */
    private string $table = 't_info_posts';

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

    public function createPost(array $data)
    {
        $now    = Carbon::now();
        $userId = optional(auth()->user())->id;

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

    public function searchItems(?string $keyword, int $page = 1, ?int $categoryId = null, ?int $perPage = null): array
    {
        $perPage = (int)($perPage ?? 20);
        $perPage = max(1, min(100, $perPage));

        $pivot = 't_category_item_combinations';

        $query = DB::table('m_items as i')
            ->whereNull('i.deleted_at');

        if (!is_null($categoryId)) {
            $query->whereExists(function ($sub) use ($pivot, $categoryId) {
                $sub->select(DB::raw(1))
                    ->from($pivot . ' as ci')
                    ->whereColumn('ci.item_id', 'i.id')
                    ->where('ci.category_id', $categoryId);
            });
        }

        if ($keyword) {
            $like = '%' . $keyword . '%';
            $query->where(function ($q) use ($like) {
                $q->where('i.name', 'like', $like)
                    ->orWhere('i.item_number', 'like', $like)
                    ->orWhere('i.code', 'like', $like);
            });
        }

        $total = (clone $query)->count();
        $page  = max(1, $page);
        $lastPage = max(1, (int)ceil($total / $perPage));

        $rows = $query
            ->leftJoin($pivot . ' as ci', 'ci.item_id', '=', 'i.id')
            ->leftJoin('m_categories as c', 'c.id', '=', 'ci.category_id')
            ->groupBy('i.id', 'i.name', 'i.code', 'i.item_number')
            ->orderBy('i.id', 'desc')
            ->forPage($page, $perPage)
            ->get([
                'i.id',
                'i.name',
                'i.code',
                'i.item_number',
                \DB::raw('MAX(c.name) as category_name'),
            ])
            ->map(function ($row) {
                return [
                    'id'            => $row->id,
                    'name'          => $row->name,
                    'code'          => $row->item_number ?: $row->code,
                    'category_name' => $row->category_name ?: null,
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
     * @return array [ { id, code, parent_code, name }, … ]
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

        Log::info('[InfoService][searchCategories] query', [
            'keyword'     => $keyword,
            'parent_code' => $parentCode,
            'sql'         => $query->toSql(),
            'bindings'    => $query->getBindings(),
        ]);

        $rows = $query
            ->orderBy('parent_code')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->limit(200)
            ->get([
                'id',
                'code',
                'parent_code',
                'name',
            ])
            ->map(function ($row) {
                return [
                    'id'          => (int)$row->id,
                    'code'        => $row->code,
                    'parent_code' => $row->parent_code,
                    'name'        => $row->name,
                ];
            })
            ->values()
            ->all();

        Log::info('[InfoService][searchCategories] result', [
            'count' => count($rows),
            'head'  => array_slice($rows, 0, 5),
        ]);

        return $rows;
    }

    // ==========================
    // 内部ユーティリティ
    // ==========================

    private function buildSaveColumns(array $data): array
    {
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
                if (is_array($value) && !empty($value)) {
                    $save['meta'] = json_encode($value, JSON_UNESCAPED_UNICODE);
                } else {
                    $save['meta'] = null;
                }
                continue;
            }

            $save[$key] = $value;
        }

        if (!array_key_exists('body_html', $save)) {
            $save['body_html'] = null;
        }

        return $save;
    }

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
