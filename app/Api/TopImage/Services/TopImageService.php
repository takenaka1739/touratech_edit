<?php

namespace App\Api\TopImage\Services;

use App\Base\Models\TSlideItem;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class TopImageService
{

    public function getList(): \Illuminate\Support\Collection
    {
        $rows = TSlideItem::with(['image:id,name'])
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return $rows->map(function (TSlideItem $r) {
            $name = optional($r->image)->name;
            return [
                'id'          => $r->id,
                'image_id'    => $r->image_id,
                'image_name'  => $name,
                'image_url'   => $name ? asset("images/{$name}") : null,
                'url'         => $r->url,
                'is_enabled'  => (bool) $r->is_enabled,
                'sort_order'  => (int) $r->sort_order,
            ];
        });
    }

    public function create(array $data)
    {
        \Log::info('[TopImageService] create raw request', request()->all());
        \Log::info('[TopImageService] create data', $data);

        return DB::transaction(function () use ($data) {
            return TSlideItem::create($data);
        });
    }

    public function bulkCreate(array $items)
    {
        return DB::transaction(function () use ($items) {
            $now = now();
            $insert = [];
            foreach ($items as $i => $row) {
                $insert[] = [
                    'image_id'   => Arr::get($row, 'image_id'),
                    'sort_order' => Arr::get($row, 'sort_order', $i + 1),
                    'is_enabled' => 1,
                    'url'        => Arr::get($row, 'url', $item->url),
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
            if (!empty($insert)) {
                TSlideItem::insert($insert);
            }
            return true;
        });
    }

    public function update(int $id, array $data)
    {
        $payload = Arr::only($data, ['image_id', 'sort_order', 'is_enabled', 'url']);

        \Log::info('[TopImageService@update] called', [
            'id' => $id,
            'payload' => $payload,
        ]);

        return DB::transaction(function () use ($id, $payload) {
            $item = TSlideItem::findOrFail($id);
            $item->update($payload);
            return $item;
        });
    }

    public function toggleVisibility(int $id)
    {
        return DB::transaction(function () use ($id) {
            $item = TSlideItem::findOrFail($id);
            $item->is_enabled = !$item->is_enabled;
            $item->save();

            return [
                'id'         => (int) $item->id,
                'is_enabled' => (bool) $item->is_enabled,
            ];
        });
    }

    public function delete(int $id)
    {
        return DB::transaction(function () use ($id) {
            $item = TSlideItem::findOrFail($id);
            $item->delete();
            return response()->noContent();
        });
    }

    public function reorder(array $ids)
    {
        return DB::transaction(function () use ($ids) {
            foreach (array_values($ids) as $index => $id) {
                TSlideItem::where('id', $id)->update(['sort_order' => $index + 1]);
            }
            return true;
        });
    }


    public function sync(array $items)
    {
        return DB::transaction(function () use ($items) {
            $keepIds = [];
            $now = now();

            \Log::info('[TopImageService@sync] received items', $items);

            foreach (array_values($items) as $index => $row) {
                $sortOrder = $index + 1;
                $id        = Arr::get($row, 'id');
                $enabled   = Arr::get($row, 'is_enabled', 1);

                if ($id) {
                    if ($item = TSlideItem::find($id)) {
                        $item->update([
                            'sort_order' => $sortOrder,
                            'is_enabled' => $enabled,
                            'url'        => Arr::get($row, 'url', $item->url),
                            'updated_at' => $now,
                        ]);
                        $keepIds[] = $item->id;
                    }
                } else {
                    $imageId = Arr::get($row, 'image_id');
                    if ($imageId) {
                        $item = TSlideItem::create([
                            'image_id'   => $imageId,
                            'sort_order' => $sortOrder,
                            'is_enabled' => $enabled,
                            'url'        => Arr::get($row, 'url'),
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]);
                        $keepIds[] = $item->id;
                    }
                }
            }

            if (count($keepIds) === 0) {
                // SoftDeletes のため論理削除。物理削除にしたいなら forceDelete() を検討
                TSlideItem::query()->delete();
                \Log::info('[TopImageService@sync] deleted all (keepIds empty)');
            } else {
                TSlideItem::whereNotIn('id', $keepIds)->delete();
                \Log::info('[TopImageService@sync] deleted others not in keepIds', $keepIds);
            }

            return response()->json(['ok' => true]);
        });
    }

    
}
