<?php

namespace App\Api\info\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\info\Requests\TopicRequest;
use App\Api\info\Services\TopicService;
use Illuminate\Http\Request;

/**
 * トピック（ショップ情報）コントローラー
 */
class TopicController extends BaseController
{
    protected $service;

    public function __construct(TopicService $service)
    {
        $this->service = $service;
    }

    /**
     * 一覧取得
     */
    public function index(Request $request)
    {
        $data = $this->service->index($request->all());
        return $this->success($data);
    }

    /**
     * 登録処理
     */
    public function store(TopicRequest $request)
    {
        $data = $request->validated();
        $this->service->store($data);
        return $this->success();
    }

    /**
     * 詳細取得
     */
    public function show($id)
    {
        $data = $this->service->show($id);
        return $this->success($data);
    }

    /**
     * 更新処理
     */
    public function update(TopicRequest $request, $id)
    {
        $data = $request->validated();
        $this->service->update($id, $data);
        return $this->success();
    }

    /**
     * 削除処理
     */
    public function destroy($id)
    {
        $this->service->destroy($id);
        return $this->success();
    }
}
