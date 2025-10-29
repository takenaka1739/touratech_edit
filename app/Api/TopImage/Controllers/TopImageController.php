<?php

namespace App\Api\TopImage\Controllers;

use App\Api\TopImage\Requests\TopImageRequest;
use App\Api\TopImage\Services\TopImageService;
use App\Base\Http\Controllers\Api\BaseController;
use Illuminate\Http\Request;

class TopImageController extends BaseController
{
    protected TopImageService $service;

    public function __construct(TopImageService $service)
    {
        $this->service = $service;
    }

    public function index()
    {
        return $this->service->getList();
    }

    public function store(TopImageRequest $request)
    {
        return $this->service->create($request->validated());
    }

    public function update(int $id, TopImageRequest $request)
    {
        return $this->service->update($id, $request->validated());
    }

    public function destroy(int $id)
    {
        return $this->service->delete($id);
    }

    public function toggle(int $id)
    {
        return $this->service->toggleVisibility($id);
    }

    public function reorder(Request $request)
    {
        return $this->service->reorder($request->input('ids', []));
    }


    public function sync(Request $request)
    {
        $items = $request->input('m_items', []);
        return $this->service->sync($items);
    }
}
