<?php

namespace App\Api\TopImage\Controllers;

use App\Base\Models\MImage;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class ImageController extends Controller
{
    public function index(Request $request)
    {
        $query = MImage::query();

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }
        $result = $query->orderBy('id', 'desc')->paginate(12);

        return response()->json($result);
    }
}
