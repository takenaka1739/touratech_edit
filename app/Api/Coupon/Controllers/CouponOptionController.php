<?php

namespace App\Api\Coupon\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use Illuminate\Http\JsonResponse;
use App\Base\Models\Item;

class CouponOptionController extends BaseController
{
    public function items(): JsonResponse
    {
        $items = Item::select('id as value', 'name')->orderBy('name')->get();

        return response()->json($items);
    }
}