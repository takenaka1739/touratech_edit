<?php

namespace App\Api\Sales\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\Sales\Services\SalesService;

class SalesController extends BaseController
{
    protected $service;

    public function __construct(SalesService $service)
    {
        $this->service = $service;
    }

    public function edit($id)
    {
        $data = $this->service->getEditData($id);
        if (!$data) {
            return response()->json(['message' => '該当データが見つかりません'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    public function create()
    {
        return response()->json([
            'success' => true,
            'data' => $this->service->getInitialData(),
        ]);
    }

    public function detail()
    {
        // 未実装
    }
}
