<?php

namespace App\Api\Item\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\Item\Requests\ImageStoreRequest;
use App\Api\Item\Requests\ImageUpdateRequest;
use App\Api\Item\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;

/**
 * 商品分類マスタ
 */
class ImageController extends BaseController
{
  /** @var \App\Api\ItemClassification\Services\ImageService */
  protected $service;

  /**
   * @param \App\Api\ItemClassification\Services\ImageService $service
   */
  public function __construct(ImageService $service)
  {
    $this->service = $service;
  }

  /**
   * 登録
   */
  public function store(ImageStoreRequest $request)
  {
    $this->service->store($request->validated());
    return $this->success();
  }

  public function serverStore(Request $request)
  {
    // 最大30MBまで
    $request->validate([
        'image' => 'required|image|max:30000',
        'filename' => 'nullable|string',
    ]);

    // アップロードされたファイルを取得
    $file = $request->file('image');

    // ファイル名を指定 or 自動生成（拡張子付き）
    $filename = $request->input('filename') 
        ?? uniqid() . '.' . $file->getClientOriginalExtension();

    // 保存先ディレクトリを確認し、なければ作成
    $directory = public_path('images');
    //if (!File::exists($directory)) {
    //    File::makeDirectory($directory, 0777, true);
    //}

    // ファイルを public/images に移動
    $file->move($directory, $filename);

    return response()->json(['path' => 'images/' . $filename], 201);
  }

  public function store_transaction(Request $request)
  {
    $request->validate([
        'images.*' => 'nullable|image|max:100000',                                                            // 商品画像（複数可）（100MB）
        'videos.*' => 'nullable|file|mimetypes:video/mp4,video/avi,video/mpeg,video/quicktime|max:500000',    // 動画（複数可）（500MB）
        'document' => 'nullable|file|mimes:pdf,jpg,jpeg,png,bmp,gif,svg,webp|max:100000',                     // 取扱説明書（100MB）
    ]);

    $paths = [];

    try
    {
      // 商品画像（複数枚可）
      if ($request->hasFile('images')) {
        foreach ($request->file('images') as $file) {
          $filename = $file->getClientOriginalName();
          $directory = public_path('images');

          if (!file_exists($directory)) mkdir($directory, 0777, true);

          // 同名ファイルは上書き保存
          $file->move($directory, $filename);
          $paths[] = 'images/' . $filename;
        }
      }

      // 動画
      if ($request->hasFile('videos')) {
        foreach ($request->file('videos') as $file) {
          $filename = $file->getClientOriginalName();
          $directory = public_path('images');

          if (!file_exists($directory)) mkdir($directory, 0777, true);

          // 同名ファイルは上書き保存
          $file->move($directory, $filename);
          $paths[] = 'images/' . $filename;
        }
      }

      // 取扱説明書
      if ($request->hasFile('document')) {
        $document = $request->file('document');
        $filename = $document->getClientOriginalName();
        $directory = public_path('files');

        if (!file_exists($directory)) mkdir($directory, 0777, true);

        // 同名ファイルは上書き保存
        $document->move($directory, $filename);
        $paths[] = 'files/' . $filename;
      }

      return response()->json(['paths' => $paths], 201);
    } catch (\Exception $e) {
      \Log::error('アップロード失敗: '.$e->getMessage());

      // クライアントにエラーを返す
      return response()->json([
        'error' => 'アップロード中に問題が発生しました',
        'details' => $e->getMessage()
      ], 500);
    }
  }

  public function videoServerStore(Request $request)
  {
    $request->validate([
        'video' => 'required|mimetypes:video/mp4,video/quicktime,video/avi,video/mpeg|max:80000',
        'filename' => 'nullable|string',
    ]);

    $file = $request->file('video');
    if (!$file) {
        return response()->json(['error' => '動画ファイルが取得できません'], 400);
    }

    $filename = $request->input('filename');
    if (!$filename || !preg_match('/^[\w\-\.]+$/', $filename)) {
        $filename = uniqid() . '.' . $file->getClientOriginalExtension();
    }

    $path = 'images/' . $filename;
    $storedPath = $path;

    //if (!Storage::disk('public')->exists($path)) {
    if (!File::exists($path)) {
        //$storedPath = $file->storeAs('images', $filename, 'public');
        $storedPath = $file->move(public_path('images'), $filename);
        if (!$storedPath) {
          return response()->json(['error' => '保存に失敗しました'], 500);
        }
        return response()->json(['path' => $storedPath], 201);
    } else {
        return response()->json(['path' => $storedPath], 200);
    }
  }


  /**
   * 更新
   *
   * @param int $id 商品分類ID
   */
  public function update(ImageUpdateRequest $request, int $id)
  {
    $this->service->update($id, $request->validated());
    return $this->success();
  }
//
//  /**
//   * 削除
//   *
//   * @param int $id 商品分類ID
//   */
  public function delete($id)
  {
    $this->service->delete($id);
    return $this->success();
  }
}