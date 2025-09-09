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
    //$selectItems = ItemClassification::find($id)->toArray();

    $selectItems = ItemClassification::select(
      'm_categories.id',
      'm_categories.is_display',
      'm_categories.code',
      'm_categories.parent_code',
      'm_categories.name',
      'm_categories.remarks',

      'm_images.id AS image_id',
      'm_images.name AS image'
    )
    ->leftJoin('m_images', 'm_categories.id', '=', 'm_images.category_id')
    ->where('m_categories.id', '=', $id)
    ->first()
    ->toArray();

    $parentName = (($selectItems['parent_code'] != null) && ($selectItems['parent_code'] != '')) ?
                  ItemClassification::where('code', '=', $selectItems['parent_code'])->first()->name : $selectItems['name'];
    $parentCode = (($selectItems['parent_code'] != null) && ($selectItems['parent_code'] != '')) ?
                    $selectItems['parent_code'] : $selectItems['code'];
    $code = (($selectItems['parent_code'] != null) && ($selectItems['parent_code'] != '')) ?
              $selectItems['code'] : '';
              
    $selectItems['parent_name'] = $parentName;
    $selectItems['parent_code'] = $parentCode;
    $selectItems['code'] = $code;


    //return ItemClassification::find($id)->toArray();
    return $selectItems;
  }

  /**
   * 登録
   *
   * @param array $data 登録データ
   */
  public function store(array $data)
  {
    $categoryMaxId = ItemClassification::max('id') + 1;
    $imageMaxId = Image::max('id') + 1;
    $data['id'] = $categoryMaxId;

    DB::transaction(function () use ($data) {
      ItemClassification::create($data);
      $categoryMaxId = ItemClassification::max('id');
      //Image::create([
      //        //'id' => $imageMaxId,
      //        'category_id' => $categoryMaxId,
      //        'item_id' => null,
      //        'name' => $data->image,
      //        'order_by' => 0
      //    ]);
    });



    //Image::create([
    //        'id' => $imageMaxId,
    //        'category_id' => $categoryMaxId,
    //        'item_id' => null,
    //        //'name' => $data['image'],
    //        'order_by' => 0
    //    ]);
  }

  /**
   * 更新
   *
   * @param int $id 商品分類ID
   * @param array $data 更新データ
   */
  public function update(int $id, array $data)
  {
    \Log::debug('デバッグ：ItemClassificationService.update');
    \Log::debug('$data');
    \Log::debug($data);
    
    $data = new Collection($data);
    DB::transaction(function () use ($id, $data) {
      $m = ItemClassification::find($id);
      $m->name = $data->get('name');
      $m->is_display = $data->get('is_display');
      $m->code = $data->get('code');
      $m->parent_code = $data->get('parent_code');
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