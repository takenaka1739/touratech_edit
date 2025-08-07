<?php

namespace App\Api\info\Services;

use App\Base\Models\Topic;

class TopicService
{
    // 一覧取得
    public function index(array $params = [])
    {
        return Topic::orderByDesc('published_at')->get()->toArray();
    }

    // 登録
    public function store(array $data)
    {
        return Topic::create($data);
    }

    // 詳細取得
    public function show($id)
    {
        return Topic::findOrFail($id);
    }

    // 更新
    public function update($id, array $data)
    {
        $topic = Topic::findOrFail($id);
        $topic->update($data);
        return $topic;
    }

    // 削除
    public function destroy($id)
    {
        $topic = Topic::findOrFail($id);
        $topic->delete();
        return true;
    }
}
