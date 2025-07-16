<?php

namespace App\Api\Coupon\Controllers;

use App\Base\Models\ItemClassification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ItemClassificationController
{
    public function index(Request $request): JsonResponse
    {
        $perPage = 12;

        $query = ItemClassification::query()
            ->where('is_display', 1)
            ->orderBy('order_by');

        if ($request->filled('keyword')) {
            $keyword = $request->input('keyword');
            $query->where('name', 'LIKE', "%{$keyword}%");
        }

        $paginator = $query->paginate($perPage);

        return response()->json([
        'rows' => $paginator->items(),
        'pager' => [
            'currentPage' => $paginator->currentPage(),
            'lastPage' => $paginator->lastPage(),
            'perPage' => $paginator->perPage(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
            'total' => $paginator->total(),
        ],
    ]);
    }
}
