<?php

namespace App\Api\Item\Services;

use App\Base\Models\Document;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;

/**
 * 商品分類マスタサービス
 */
class DocumentService
{
  /**
   * 登録
   *
   * @param array $data 登録データ
   */
  public function store(array $data)
  {
    $newId = DB::transaction(function () use ($data) {
      $item = Document::create([
        'item_id'     => $data['item_id'],
        'type_status' => $data['type_status'],
        'type_name'   => $data['type_name'],
        'file_name'   => $data['file_name']
      ]);
      return $item->id;
    });

    return $newId;
  }

/**
   * 更新
   *
   * @param int $id 商品分類ID
   * @param array $data 更新データ
   */
  public function update(int $id, array $data)
  {
    $data = new Collection($data);
    DB::transaction(function () use ($id, $data) {
      $m = Document::find($id);
      $m->item_id     = $data->get('item_id');
      $m->type_status = $data->get('type_status');
      $m->type_name   = $data->get('type_name');
      $m->file_name   = $data->get('file_name');
      $m->save();
    });
  }

  /**
   * 削除
   *
   * @param int $id 商品分類ID
   */
  public function delete(int $id)
  {
    DB::transaction(function () use ($id) {
      Document::destroy($id);
    });
  }
}