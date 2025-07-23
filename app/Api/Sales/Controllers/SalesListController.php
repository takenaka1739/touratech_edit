<?php

namespace App\Api\Sales\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use Illuminate\Http\Request;
use App\Api\Sales\Requests\SalesListRequest;
use App\Api\Sales\Services\SalesListService;

class SalesListController extends BaseController
{
    public function fetch(SalesListRequest $request, SalesListService $service)
    {
        $data = $service->getList($request->validated());
        return $this->success($data);
    }
}
