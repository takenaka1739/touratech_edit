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
    $query = ItemClassification::select('id', 'name');
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
    $query = ItemClassification::select('id', 'name', 'code', 'parent_code', 'is_display', 'sort_order');
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
    $selectItems = ItemClassification::select(
      'm_categories.id',
      'm_categories.is_display',
      'm_categories.code',
      'm_categories.parent_code',
      'm_categories.name',
      'm_categories.remarks',
      'm_categories.sort_order',
      'm_images.id AS image_id',
      'm_images.name AS image'
    )
    ->leftJoin('m_images', 'm_categories.id', '=', 'm_images.category_id')
    ->where('m_categories.id', '=', $id)
    ->first()
    ->toArray();

    $parentName = (($selectItems['parent_code'] ?? '') !== '' )
      ? ItemClassification::where('code', $selectItems['parent_code'])->value('name')
      : $selectItems['name'];

    $parentCode = (($selectItems['parent_code'] ?? '') !== '' )
      ? $selectItems['parent_code']
      : $selectItems['code'];

    $code = (($selectItems['parent_code'] ?? '') !== '' )
      ? $selectItems['code']
      : '';

    $selectItems['parent_name'] = $parentName;
    $selectItems['parent_code'] = $parentCode;
    $selectItems['code']        = $code;

    return $selectItems;
  }

  /**
   * 登録（作成したIDを返す）
   *
   * @param array $data 登録データ
   * @return int 新規作成したカテゴリID
   */
  public function store(array $data): int
  {
    Log::info('ItemClassificationService@store:start', ['data' => $data]);

    $newId = 0;

    DB::transaction(function () use ($data, &$newId) {
      // AUTO_INCREMENT に任せる
      $model = ItemClassification::create($data);
      $newId = (int)$model->id;
    });

    Log::info('ItemClassificationService@store:done', ['id' => $newId]);
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
    Log::debug('デバッグ：ItemClassificationService.update', $data);

    $data = new Collection($data);
    DB::transaction(function () use ($id, $data) {
      $m = ItemClassification::find($id);
      $m->name        = $data->get('name');
      $m->is_display  = $data->get('is_display');
      $m->code        = $data->get('code');
      $m->parent_code = $data->get('parent_code');
      $m->sort_order  = $data->get('sort_order', 0);
      $m->remarks     = $data->get('remarks');
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
      $keywords = explode(' ', $c_keyword);
      foreach ($keywords as $key) {
        $query->where(function($query) use ($key) {
          $query->where('name', 'like', '%' . escape_like($key) . '%');
        });
      }
    }
    return $query;
  }
}
