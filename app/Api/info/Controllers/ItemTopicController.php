<?php

namespace App\Api\info\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\info\Requests\ItemTopicRequest;
use App\Api\info\Services\ItemTopicService;
use Illuminate\Http\Request;

/**
 * 商品情報（ItemTopic）コントローラー
 */
class ItemTopicController extends BaseController
{
    protected $service;

    public function __construct(ItemTopicService $service)
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
    public function store(ItemTopicRequest $request)
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
    public function update(ItemTopicRequest $request, $id)
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
