<?php

namespace App\Api\TopImage\Services;

use App\Base\Models\TSlideItem;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TopImageService
{
    public function getList(): \Illuminate\Support\Collection
    {
        Log::info('[TopImageService][getList] start');

        $rows = TSlideItem::with(['image:id,name'])
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        Log::info('[TopImageService][getList] fetched', ['count' => $rows->count()]);

        $mapped = $rows->map(function (TSlideItem $r) {
            $name = optional($r->image)->name;
            return [
                'id'            => $r->id,
                'image_id'      => $r->image_id,
                'image_name'    => $name,
                'image_url'     => $name ? asset("images/{$name}") : null,
                'url'           => $r->url,
                'is_published'  => (bool) $r->is_published,
                'sort_order'    => (int) $r->sort_order,
            ];
        });

        Log::info('[TopImageService][getList] mapped', ['count' => $mapped->count()]);
        return $mapped;
    }

    public function create(array $data)
    {
        Log::info('[TopImageService][create] input', ['data' => Arr::except($data, ['binary', 'file'])]);

        try {
            return DB::transaction(function () use ($data) {
                $created = TSlideItem::create($data);
                Log::info('[TopImageService][create] created', ['id' => $created->id]);
                return $created;
            });
        } catch (\Throwable $e) {
            Log::error('[TopImageService][create] failed', [
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    public function bulkCreate(array $items)
    {
        Log::info('[TopImageService][bulkCreate] input', [
            'count' => count($items),
            'keys0' => isset($items[0]) ? array_keys($items[0]) : [],
        ]);

        try {
            return DB::transaction(function () use ($items) {
                $now = now();
                $insert = [];
                foreach ($items as $i => $row) {
                    $insert[] = [
                        'image_id'     => Arr::get($row, 'image_id'),
                        'sort_order'   => Arr::get($row, 'sort_order', $i + 1),
                        'is_published' => 1,
                        // 修正: 未定義変数 $item を参照していたため、$row から取得に変更
                        'url'          => Arr::get($row, 'url'),
                        'created_at'   => $now,
                        'updated_at'   => $now,
                    ];
                }
                if (!empty($insert)) {
                    TSlideItem::insert($insert);
                }
                Log::info('[TopImageService][bulkCreate] inserted', ['count' => count($insert)]);
                return true;
            });
        } catch (\Throwable $e) {
            Log::error('[TopImageService][bulkCreate] failed', [
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    public function update(int $id, array $data)
    {
        $payload = Arr::only($data, ['image_id', 'sort_order', 'is_published', 'url']);
        Log::info('[TopImageService][update] input', ['id' => $id, 'payload' => $payload]);

        try {
            return DB::transaction(function () use ($id, $payload) {
                $item = TSlideItem::findOrFail($id);
                $item->update($payload);
                Log::info('[TopImageService][update] updated', ['id' => $item->id]);
                return $item;
            });
        } catch (\Throwable $e) {
            Log::error('[TopImageService][update] failed', [
                'id'      => $id,
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    public function toggleVisibility(int $id)
    {
        Log::info('[TopImageService][toggleVisibility] input', ['id' => $id]);

        try {
            return DB::transaction(function () use ($id) {
                $item = TSlideItem::findOrFail($id);

                $item->is_published = !$item->is_published;
                $item->save();

                Log::info('[TopImageService][toggleVisibility] toggled', [
                    'id'           => $item->id,
                    'is_published' => (bool) $item->is_published,
                ]);

                return [
                    'id'         => (int) $item->id,
                    'is_enabled' => (bool) $item->is_published,
                ];
            });
        } catch (\Throwable $e) {
            Log::error('[TopImageService][toggleVisibility] failed', [
                'id'      => $id,
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }


    public function delete(int $id)
    {
        Log::info('[TopImageService][delete] input', ['id' => $id]);

        try {
            return DB::transaction(function () use ($id) {
                $item = TSlideItem::findOrFail($id);
                $item->delete();
                Log::info('[TopImageService][delete] deleted', ['id' => $id]);
                return response()->noContent();
            });
        } catch (\Throwable $e) {
            Log::error('[TopImageService][delete] failed', [
                'id'      => $id,
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    public function reorder(array $ids)
    {
        Log::info('[TopImageService][reorder] input', ['ids' => array_values($ids)]);

        try {
            return DB::transaction(function () use ($ids) {
                foreach (array_values($ids) as $index => $id) {
                    TSlideItem::where('id', $id)->update(['sort_order' => $index + 1]);
                }
                Log::info('[TopImageService][reorder] done', ['count' => count($ids)]);
                return true;
            });
        } catch (\Throwable $e) {
            Log::error('[TopImageService][reorder] failed', [
                'ids'     => $ids,
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    public function sync(array $items)
    {
        Log::info('[TopImageService][sync] input', [
            'count' => count($items),
            'keys0' => isset($items[0]) ? array_keys($items[0]) : [],
        ]);

        try {
            return DB::transaction(function () use ($items) {
                $keepIds = [];
                $now = now();

                foreach (array_values($items) as $index => $row) {
                    $sortOrder = $index + 1;
                    $id        = Arr::get($row, 'id');
                    $enabled   = Arr::get($row, 'is_published', 1);

                    if ($id) {
                        if ($item = TSlideItem::find($id)) {
                            $item->update([
                                'sort_order'   => $sortOrder,
                                'is_published' => $enabled,
                                'url'          => Arr::get($row, 'url', $item->url),
                                'updated_at'   => $now,
                            ]);
                            $keepIds[] = $item->id;
                        }
                    } else {
                        $imageId = Arr::get($row, 'image_id');
                        if ($imageId) {
                            $item = TSlideItem::create([
                                'image_id'     => $imageId,
                                'sort_order'   => $sortOrder,
                                'is_published' => $enabled,
                                'url'          => Arr::get($row, 'url'),
                                'created_at'   => $now,
                                'updated_at'   => $now,
                            ]);
                            $keepIds[] = $item->id;
                        }
                    }
                }

                if (count($keepIds) === 0) {
                    // SoftDeletes のため論理削除。物理削除にしたいなら forceDelete() を検討
                    $deleted = TSlideItem::query()->delete();
                    Log::info('[TopImageService][sync] soft-deleted all', ['deleted' => $deleted]);
                } else {
                    $deleted = TSlideItem::whereNotIn('id', $keepIds)->delete();
                    Log::info('[TopImageService][sync] soft-deleted others', [
                        'keepIds' => $keepIds,
                        'deleted' => $deleted,
                    ]);
                }

                Log::info('[TopImageService][sync] done', ['kept' => count($keepIds)]);
                return response()->json(['ok' => true]);
            });
        } catch (\Throwable $e) {
            Log::error('[TopImageService][sync] failed', [
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }
}
