<?php

namespace App\Api\ItemClassification\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\ItemClassification\Requests\ItemClassificationRequest;
use App\Api\ItemClassification\Services\ItemClassificationService;
use Illuminate\Http\Request;

/**
 * 商品分類マスタ
 */
class ItemClassificationController extends BaseController
{
    /** @var \App\Api\ItemClassification\Services\ItemClassificationService */
    protected $service;

    public function __construct(ItemClassificationService $service)
    {
        $this->service = $service;
    }

    /** 検索ダイアログ */
    public function dialog(Request $request)
    {
        $input = $request->all();
        $data  = $this->service->dialog($input);
        return $this->success($data);
    }

    /** 選択 */
    public function selected(int $id)
    {
        $data = $this->service->get($id);
        return $this->success($data);
    }

    /** 一覧 */
    public function fetch(Request $request)
    {
        $input = $request->all();
        $data  = $this->service->fetch($input);
        return $this->success($data);
    }

    /** 詳細 */
    public function edit(int $id)
    {
        $data = $this->service->get($id);
        return $this->success($data);
    }

    /** 登録（作成IDを返却） */
    public function store(ItemClassificationRequest $request)
    {
        $newId = $this->service->store($request->validated());

        return $this->success(['id' => $newId]);
    }

    /** 更新 */
    public function update(ItemClassificationRequest $request, int $id)
    {
        $this->service->update($id, $request->validated());

        return $this->success();
    }

    /** 削除 */
    public function delete(int $id)
    {
        $this->service->delete($id);
        return $this->success();
    }
}