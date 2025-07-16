<?php

namespace App\Api\TopImage\Services;

use App\Base\Models\TSlideItem;
use Illuminate\Support\Facades\DB;

class TopImageService
{
    /**
     * 一覧取得
     */
    public function getAll()
    {
        return TSlideItem::with('image:id,image_name') // リレーションで画像名取得
            ->orderBy('id')
            ->get();
    }

    /**
     * 新規登録
     */
    public function create(array $data)
    {
        return DB::transaction(function () use ($data) {
            return TSlideItem::create($data);
        });
    }

    /**
     * 更新
     */
    public function update(int $id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $item = TSlideItem::findOrFail($id);
            $item->update($data);
            return $item;
        });
    }

    /**
     * 表示/非表示切り替え
     */
    public function toggleVisibility(int $id)
    {
        return DB::transaction(function () use ($id) {
            $item = TSlideItem::findOrFail($id);
            $item->is_enabled = !$item->is_enabled;
            $item->save();
            return $item;
        });
    }

    /**
     * 論理削除
     */
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
            foreach ($ids as $index => $id) {
                TSlideItem::where('id', $id)->update(['sort_order' => $index + 1]);
            }
        });
    }

    public function getList(): \Illuminate\Support\Collection
    {
        return TSlideItem::with('image')
            ->orderBy('id') // 必要に応じてソート条件を変更
            ->get();
    }
}
