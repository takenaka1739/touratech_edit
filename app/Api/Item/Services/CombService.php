<?php

namespace App\Api\Item\Services;

use App\Base\Models\ItemCategoryCombination;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * 商品分類マスタサービス
 */
class CombService
{
  /**
   * 登録
   *
   * @param array $data 登録データ
   */
  public function store(array $data)
  {
    $newId = DB::transaction(function () use ($data) {
      $item = ItemCategoryCombination::create([
        'category_id' => $data['category_id'],
        'item_id' => $data['item_id'],
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
      $m = ItemCategoryCombination::find($id);
      $m->item_id = $data->get('item_id');
      $m->category_id = $data->get('category_id');
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
      ItemCategoryCombination::destroy($id);
    });
  }
}