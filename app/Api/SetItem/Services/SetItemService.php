<?php

namespace App\Api\SetItem\Services;

use App\Base\Models\Item;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * セット品マスタサービス
 */
class SetItemService
{
  /**
   * 検索画面用の一覧データを取得する
   *
   * @param array $cond 検索条件
   * @return array
   */
  public function dialog(array $cond)
  {
    $query = Item::select(
      'items.item_number',
      'items.id',
      'items.name_jp',
      'items.sales_unit_price',
      'set_items.total_quantity',
    );
    $query = $this->setCondition($query, $cond);
    $query->orderBy('item_number', 'asc');
    return $query->paginate(config('const.paginate.per_page'))->toArray();
  }

  /**
   * 一覧データを取得する
   *
   * @param array $cond 検索条件
   * @return array
   */
  public function fetch(array $cond)
  {
    $query = Item::select(
      'items.item_number',
      'items.id',
      'items.name_jp',
      'items.sales_unit_price',
      'set_items.total_quantity',
    );
    $query = $this->setCondition($query, $cond);
    $query->orderBy('item_number', 'asc');
    return $query->paginate(config('const.paginate.per_page'))->toArray();
  }

  /**
   * 詳細データを取得する
   *
   * @param int $id セット品ID
   * @return array
   */
  public function get(int $id)
  {
    $data = Item::select(
      'items.id',
      'items.item_number',
      'items.name_jp',
      'items.sales_unit_price',
      'items.discontinued_date',
      'items.is_display',
    )
      ->where('items.id', $id)
      ->first()
      ->toArray();

    $data['details'] = $this->getDetails($id);
    return $data;
  }

  /**
   * 登録
   *
   * @param array $data 登録データ
   */
  public function store(array $data)
  {
    $data = new Collection($data);
    DB::transaction(function () use ($data) {
      $m = Item::make($data->toArray());
      $m->is_discontinued = $data->has('discontinued_date');
      $m->is_set_item = true;
      $m->save();

      $details = $data->get('details');
      $this->saveDetails($m->id, $details);
    });
  }

  /**
   * 更新
   *
   * @param int $id セット品ID
   * @param array $data 更新データ
   */
  public function update(int $id, array $data)
  {
    $data = new Collection($data);
    DB::transaction(function () use ($id, $data) {
      $m = Item::find($id);
      $m->item_number = $data->get('item_number');
      $m->name_jp = $data->get('name_jp');
      $m->sales_unit_price = $data->get('sales_unit_price');
      $discontinued_date = $data->get('discontinued_date');
      $m->is_discontinued = $discontinued_date ? true : false;
      $m->discontinued_date = $discontinued_date;
      $m->is_display = $data->get('is_display');
      $m->save();

      $details = $data->get('details');
      $this->saveDetails($id, $details);
    });
  }

  /**
   * 削除
   *
   * @param int $id セット品ID
   */
  public function delete(int $id)
  {
    DB::transaction(function () use ($id) {
      Item::destroy($id);
    });
  }

  /**
   * 条件を設定する
   *
   * @param \Illuminate\Database\Eloquent\Builder $query
   * @param array $cond 条件
   * @return mixed
   */
  private function setCondition($query, array $cond)
  {
    $query->leftJoin('set_items', 'set_items.set_item_id', '=', 'items.id');

    $cond = new Collection($cond);
    $c_keyword = $cond->get('c_keyword');
    if ($c_keyword !== null && $c_keyword !== '') {
      $keywords = explode(" ", $c_keyword);
      foreach ($keywords as $key) {
        $query->where(function($query) use ($key) {
          $query->where('item_number', 'like', '%' . escape_like($key) . '%')
            ->orWhere('name_jp', 'like', '%' . escape_like($key) . '%');
        });
      }
    }

    $is_set_item = $cond->get('c_is_set_item');
    if (!is_null($is_set_item)) {
      $query->where('is_set_item', $is_set_item);
    }

    $c_is_display = $cond->get('c_is_display');
    if ($c_is_display !== "none") {
      $query->where('is_display', $c_is_display === "1");
    }

    $has_discontinued = $cond->get('c_has_discontinued');
    if (!$has_discontinued) {
      $query->whereNull('discontinued_date');
    }

    return $query;
  }

  /**
   * 明細データを取得する
   *
   * @param int $id セット品ID
   * @return array
   */
  private function getDetails(int $id)
  {
    return DB::table('set_item_details')
      ->join('items', 'items.id', '=', 'set_item_details.item_id')
      ->select(
        'set_item_details.*',
        'items.name AS item_name',
        'items.name_jp AS item_name_jp',
        'items.item_number',
        'items.sales_unit_price'
        )
      ->where('set_item_id', $id)
      ->get()
      ->toArray();
  }

  /**
   * 明細を保存する
   *
   * @param int $id セット品ID
   * @param mixed $details 明細データ
   */
  private function saveDetails(int $id, $details)
  {
    DB::table('set_items')->where('set_item_id', '=', $id)->delete();
    DB::table('set_item_details')->where('set_item_id', '=', $id)->delete();

    $total_quantity = 0;
    if ($details) {
      $data = [];
      foreach ($details as $detail) {
        $detail = new Collection($detail);
        $data[] = [
          'set_item_id' => $id,
          'id' => $detail->get('id'),
          'item_id' => $detail->get('item_id'),
          'quantity' => $detail->get('quantity'),
          'set_price' => $detail->get('set_price'),
        ];
        $total_quantity += (int)$detail->get('quantity');
      }
      DB::table('set_item_details')->insert($data);
    }
    DB::table('set_items')->insert([[
      'set_item_id' => $id,
      'total_quantity' => $total_quantity,
    ]]);
  }
}