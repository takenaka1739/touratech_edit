<?php

namespace App\Api\Item\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\Item\Requests\DocumentStoreRequest;
use App\Api\Item\Requests\DocumentUpdateRequest;
use App\Api\Item\Services\DocumentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

/**
 * 商品分類マスタ
 */
class DocumentController extends BaseController
{
  /** @var \App\Api\ItemClassification\Services\DocumentService */
  protected $service;

  /**
   * @param \App\Api\ItemClassification\Services\DocumentService $service
   */
  public function __construct(DocumentService $service)
  {
    $this->service = $service;
  }

  /**
   * 登録
   */
  public function store(DocumentStoreRequest $request)
  {
    $newId = $this->service->store($request->validated());
    return response()->json([
        'success' => true,
        'id' => $newId,
    ]);
  }

  // pdfファイル保存
  public function serverStore(Request $request)
  {
    $request->validate([
        'pdf' => 'required|file|mimes:pdf|max:30000',
        'filename' => 'nullable|string',
    ]);

    $file = $request->file('pdf');
    $filename = $request->input('filename') ?? uniqid() . '.' . $file->getClientOriginalExtension();
    $path = public_path('files/' . $filename);

    // 既に同じファイル名が存在するかチェック
    if (File::exists($path)) {
        return response()->json([
            'success' => true,
            'exists'  => true,
            'path'    => $path,
        ], 200);
    }

    // 存在しなければ保存
    $file->move(public_path('files'), $filename);

    return response()->json([
        'success' => true,
        'exists'  => false,
        'path'    => $path,
    ], 201);
  }

  // 画像ファイル保存
  public function imageServerStore(Request $request)
  {
    $request->validate([
        'image' => 'required|image|max:30000',
        'filename' => 'nullable|string',
    ]);

    $filename = $request->input('filename');
    $path = public_path('files/' . $filename);

    if (!File::exists($path)) {
      $file = $request->file('image');
      $filename = $request->input('filename') ?? uniqid() . '.' . $file->getClientOriginalExtension();
      $path = $file->move(public_path('files'), $filename);
      return response()->json(['path' => $path], 201);
    }else{
      return response()->json(['path' => $path], 200);
    }
  }

  /**
   * 更新
   *
   * @param int $id ファイルID
   */
  public function update(DocumentUpdateRequest $request, int $id)
  {
    \Log::debug('pdf1ファイルのupdate');
    $this->service->update($id, $request->validated());
    return $this->success();
  }

  /**
   * 削除
   *
   * @param int $id ファイルID
   */
  public function delete(int $id)
  {
    $this->service->delete($id);

    return $this->success();
  }
}
