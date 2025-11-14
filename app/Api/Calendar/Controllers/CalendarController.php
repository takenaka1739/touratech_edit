<?php

namespace App\Api\Calendar\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\Calendar\Requests\CalendarStoreRequest;
use App\Api\Calendar\Requests\CalendarUpdateRequest;
use App\Api\Calendar\Services\CalendarService;
use App\Base\Models\Calendar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * カレンダーマスタコントローラー
 */
class CalendarController extends BaseController
{
    protected $service;

    public function __construct(CalendarService $service)
    {
        $this->service = $service;
    }

    public function selected(int $id)
    {
        $data = $this->service->get($id);
        return $this->success($data);
    }

    public function fetch(Request $request)
    {
        $input = $request->all();
        $data = $this->service->fetch($input);
        return $this->success($data);
    }

    public function edit(int $id)
    {
        $data = $this->service->get($id);
        return $this->success($data);
    }

    /**
     * 登録処理
     */
    public function store(CalendarStoreRequest $request)
    {
        $this->service->store($request->validated());
        return $this->success();
    }

    /**
     * 更新処理
     */
    public function update(CalendarUpdateRequest $request, int $id)
    {
        $this->service->update($id, $request->validated());
        return $this->success();
    }

    public function delete(int $id)
    {
        $this->service->delete($id);
        return $this->success();
    }
}
