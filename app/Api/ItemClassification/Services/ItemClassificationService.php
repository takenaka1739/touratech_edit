<?php

namespace App\Api\ItemClassification\Services;

use App\Base\Models\ItemClassification;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * 商品分類マスタサービス
 */
class ItemClassificationService
{
  /**
   * 検索画面用の一覧データを取得する
   *
   * @param array $cond 検索条件
   * @return array
   */
  public function dialog(array $cond)
  {
    $query = ItemClassification::select(
      'id',
      'name',
    );
    $query = $this->setCondition($query, $cond);
    $query->orderBy('name', 'asc');
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
    $query = ItemClassification::select(
      'id',
      'name',
    );
    $query = $this->setCondition($query, $cond);
    $query->orderBy('name', 'asc');
    return $query->paginate(config('const.paginate.per_page'))->toArray();
  }

  /**
   * 詳細データを取得する
   *
   * @param int $id 商品分類ID
   * @return array
   */
  public function get(int $id)
  {
    return ItemClassification::find($id)->toArray();
  }

  /**
   * 登録
   *
   * @param array $data 登録データ
   */
  public function store(array $data)
  {
    DB::transaction(function () use ($data) {
      ItemClassification::create($data);
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
      $m = ItemClassification::find($id);
      $m->name = $data->get('name');
      $m->remarks = $data->get('remarks');
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

  /**
   * 条件を設定する
   *
   * @param \Illuminate\Database\Eloquent\Builder $query
   * @param array $cond 条件
   * @return mixed
   */
  private function setCondition($query, array $cond)
  {
    $cond = new Collection($cond);
    $c_keyword = $cond->get('c_keyword');
    if ($c_keyword !== null && $c_keyword !== '') {
      $keywords = explode(" ", $c_keyword);
      foreach ($keywords as $key) {
        $query->where(function($query) use ($key) {
          $query->where('name', 'like', '%' . escape_like($key) . '%');
        });
      }
    }
    return $query;
  }
}