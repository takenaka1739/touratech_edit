<?php

namespace App\Api\Coupon\Controllers;

use App\Base\Models\Item;
use Illuminate\Http\Request;
use App\Base\Http\Controllers\Controller;

class ItemController extends Controller
{
    public function index(Request $request)
    {
        $query = Item::query();

        if ($keyword = $request->input('keyword')) {
            $query->where(function ($q) use ($keyword) {
                $q->where('name', 'like', "%{$keyword}%")
                ->orWhere('code', 'like', "%{$keyword}%");
            });
        }

        $items = $query->paginate(15);

        return response()->json([
            'rows' => $items->items(),
            'pager' => [
                'currentPage' => $items->currentPage(),
                'lastPage' => $items->lastPage(),
                'perPage' => $items->perPage(),
                'from' => $items->firstItem(),
                'to' => $items->lastItem(),
                'total' => $items->total(),
            ],
        ]);
    }
}
