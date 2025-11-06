<?php

namespace App\Api\Item\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UploadController extends BaseController
{
  public function store(Request $request)
  {
    \Log::debug('UploadController.store');
    \Log::debug($request);

    $request->validate([
        'file' => 'required|file|image|max:2048',
    ]);

    $file = $request->file('file');
    // 任意のファイル名（拡張子も含めて指定）
    $filename = $file->getClientOriginalName();

    // 保存（storage/app/public/images に保存される）
    //$path = $file->storeAs('public/images', $filename);
    $path = $file->storeAs('public/images', $filename);

    \Log::debug('$path');
    \Log::debug($path);

    if (!$path) {
        \Log::error('$path：ファイル保存に失敗しました');
        return response()->json(['success' => false], 500);
    }


    return response()->json([
        'success' => true,
        'url' => Storage::url($path), // /storage/images/...
    ]);
  }
}
