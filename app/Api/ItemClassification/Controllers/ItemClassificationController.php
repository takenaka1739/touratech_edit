<?php

namespace App\Api\ItemClassification\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
// use App\Api\ItemClassification\Requests\ItemClassificationStoreRequest;
// use App\Api\ItemClassification\Requests\ItemClassificationUpdateRequest;
use App\Api\ItemClassification\Services\ItemClassificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

/**
 * 商品分類マスタ
 */
class ItemClassificationController extends BaseController
{
    /** @var \App\Api\ItemClassification\Services\ItemClassificationService */
    protected $service;

    public function __construct(ItemClassificationService $service)
    {
        Log::debug('デバッグ：ItemClassification.__construct');
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
      Log::debug('デバッグ：ItemClassification.selected');
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
    public function store(Request $request)
    {
        // ここで直接バリデーション
        $valid = $request->validate([
            'is_display'  => ['required', 'boolean'],
            'name'        => ['required', 'string', 'max:30'],
            'code'        => ['required', 'string', 'max:20'],
            'parent_code' => ['nullable', 'string', 'max:20'],
            'sort_order'  => ['nullable', 'integer', 'min:0'],
            'remarks'     => ['nullable', 'string', 'max:500'],
            // 画像系は別API
        ], [], [
            'is_display'  => 'ショップへの公開',
            'name'        => '商品分類名',
            'code'        => '分類コード',
            'parent_code' => '親カテゴリ',
            'sort_order'  => '表示順',
            'remarks'     => '備考',
        ]);

        Log::info('ItemClassificationController@store:start', ['input' => $valid]);

        $newId = $this->service->store($valid);

        Log::info('ItemClassificationController@store:done', ['id' => $newId]);
        return $this->success(['id' => $newId]);
    }

    /** 更新（同じルールでOK） */
    public function update(Request $request, int $id)
    {
        $valid = $request->validate([
            'is_display'  => ['required', 'boolean'],
            'name'        => ['required', 'string', 'max:30'],
            'code'        => ['required', 'string', 'max:20'],
            'parent_code' => ['nullable', 'string', 'max:20'],
            'sort_order'  => ['nullable', 'integer', 'min:0'],
            'remarks'     => ['nullable', 'string', 'max:500'],
        ], [], [
            'is_display'  => 'ショップへの公開',
            'name'        => '商品分類名',
            'code'        => '分類コード',
            'parent_code' => '親カテゴリ',
            'sort_order'  => '表示順',
            'remarks'     => '備考',
        ]);

        Log::debug('デバッグ：ItemClassification.update', $valid);

        $this->service->update($id, $valid);

        return $this->success();
    }

    /** 削除 */
    public function delete(int $id)
    {
        $this->service->delete($id);
        return $this->success();
    }
}
