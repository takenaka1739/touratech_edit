<?php

namespace App\Api\Item\Services;

use App\Base\Models\Item;
use App\Base\Models\Image;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * 商品分類マスタサービス
 */
class ImageService
{
  /**
   * 登録
   *
   * @param array $data 登録データ
   */
  public function store(array $data)
  {
    DB::transaction(function () use ($data) {
      Image::create([
              //'id' => $imageMaxId,
              'category_id' => null,
              'item_id' => $data['item_id'],
              'name' => $data['name'],
              'order_by' =>$data['order_by']
          ]);
    });
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
      $m = Image::find($id);
      $m->order_by = $data->get('order_by');
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
      Image::destroy($id);
    });
  }
}