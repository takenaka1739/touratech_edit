<?php

namespace App\Api\info\Services;

use App\Base\Models\ItemTopic;

class ItemTopicService
{
    // 一覧取得
    public function index(array $params = [])
    {
        // 必要があれば $params を利用
        return ItemTopic::orderByDesc('published_at')->get()->toArray();
    }

    // 登録
    public function store(array $data)
    {
        return ItemTopic::create($data);
    }

    // 詳細取得
    public function show($id)
    {
        return ItemTopic::findOrFail($id);
    }

    // 更新
    public function update($id, array $data)
    {
        $itemTopic = ItemTopic::findOrFail($id);
        $itemTopic->update($data);
        return $itemTopic;
    }

    // 削除
    public function destroy($id)
    {
        $itemTopic = ItemTopic::findOrFail($id);
        $itemTopic->delete();
        return true;
    }
}
