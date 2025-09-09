<?php

namespace App\Api\ItemClassification\Services;

use App\Base\Models\ItemClassification;
use App\Base\Models\Image;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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
    $imageMaxId = Image::max('id') + 1;

    DB::transaction(function () use ($data) {
      Image::create([
              //'id' => $imageMaxId,
              'category_id' => ItemClassification::max('id'),
              'item_id' => null,
              'name' => $data['name'],
              'order_by' => 0
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
      $m->name = ($m->name != $data->get('name')) ? $data->get('name') : $m->name;
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
      ItemClassification::destroy($id);
    });
  }
}