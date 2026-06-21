<?php

namespace App\Api\ShippingRate\Controllers;

use App\Api\ShippingRate\Requests\ShippingRateUpdateRequest;
use App\Api\ShippingRate\Services\ShippingRateService;
use App\Base\Http\Controllers\Api\BaseController;

class ShippingRateController extends BaseController
{
    protected $service;

    public function __construct(ShippingRateService $service)
    {
        $this->service = $service;
    }

    public function index()
    {
        return $this->success($this->service->get());
    }

    public function update(ShippingRateUpdateRequest $request)
    {
        $this->service->update($request->validated());
        return $this->success();
    }
}
