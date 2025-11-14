<?php

namespace App\Api\Item\Services;

use App\Base\Models\SpecialSale;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * 商品分類マスタサービス
 */
class SpecialSaleService
{ 
  public function store(array $data)
  {
    DB::transaction(function () use ($data) {
      SpecialSale::create([
              'is_sales_members_only' => $data['is_sales_members_only'],
              'item_id' => $data['item_id'],
              'start_at' => $data['start_at'],
              'end_at' => $data['end_at'],
              'special_sale_price' => $data['special_sale_price'],
              'refund_rate' => $data['refund_rate'],
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
      $m = SpecialSale::find($id);
      $m->is_sales_members_only = $data->get('is_sales_members_only');
      $m->start_at = $data->get('start_at');
      $m->end_at = $data->get('end_at');
      $m->special_sale_price = $data->get('special_sale_price');
      $m->refund_rate = $data->get('refund_rate');
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
      SpecialSale::destroy($id);
    });
  }
}