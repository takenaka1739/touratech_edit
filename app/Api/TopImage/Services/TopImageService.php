<?php

namespace App\Api\TopImage\Services;

use App\Base\Models\TSlideItem;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TopImageService
{
    /**
     * 一覧取得
     */
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

    /**
     * 一括同期
     * フロントは axios.post('/api/TopImage/sync', { items })
     */
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
