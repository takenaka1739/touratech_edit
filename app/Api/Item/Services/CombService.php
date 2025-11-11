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
    //$imageMaxId = Image::max('id') + 1;
    \Log::debug('CombService.store');
    \Log::debug($data);
    DB::transaction(function () use ($data) {
      ItemCategoryCombination::create([
              'category_id' => $data['category_id'],
              'item_id' => $data['item_id'],
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
    \Log::debug('CombService.update');
    \Log::debug($id);
    \Log::debug($data);

    $data = new Collection($data);
    DB::transaction(function () use ($id, $data) {
      $m = ItemCategoryCombination::find($id);
      $m->item_id = $data->get('item_id');
      $m->category_id = $data->get('category_id');
      $m->save();
    });
  }
}