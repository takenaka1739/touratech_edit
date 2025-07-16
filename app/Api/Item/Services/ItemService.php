<?php

namespace App\Api\Item\Services;

use App\Base\Models\Item;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * 商品マスタサービス
 */
class ItemService
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
      'id',
      'code',
      'name',
      'name',
      'sales_unit_price',
      'purchase_unit_price',
    );
    $query = $this->setCondition($query, $cond);
    $query->orderBy('code', 'asc');
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
      'id',
      'code',
      'name',
      'name',
      'sales_unit_price',
      'purchase_unit_price',
    );
    $query = $this->setCondition($query, $cond);
    $query->orderBy('code', 'asc');
    return $query->paginate(config('const.paginate.per_page'))->toArray();
  }

  /**
   * 詳細データを取得する
   *
   * @param int $id 商品ID
   * @return array
   */
  public function get(int $id)
  {
    return Item::select(
      'items.id',
      'items.code',
      'items.name',
      'items.name',
      'items.name_label',
      'items.category_id',
      'items.sales_unit_price',
      'items.purchase_unit_price',
      'items.sample_price',
      'items.supplier_id',
      'items.is_discontinued',
      'items.discontinued_at',
      'items.is_display',
      'items.stock_display',
      'items.remarks',
      'item_classifications.name AS item_classification_name',
      'suppliers.name AS supplier_name',
    )
      ->leftJoin('item_classifications', 'item_classifications.id', '=', 'items.category_id')
      ->leftJoin('suppliers', 'suppliers.id', '=', 'items.supplier_id')
      ->where('items.id', $id)
      ->first()
      ->toArray();
  }

  /**
   * 詳細データを取得する
   *
   * @param int $id 商品ID
   * @return array
   */
  public function selected(int $id)
  {
    return Item::select(
      'items.id',
      'items.code',
      'items.name',
      'items.name',
      'items.category_id',
      'items.sales_unit_price',
      'items.purchase_unit_price',
      'item_classifications.name AS item_classification_name',
    )
      ->leftJoin('item_classifications', 'item_classifications.id', '=', 'items.category_id')
      ->where('items.id', $id)
      ->first()
      ->toArray();
  }

  /**
   * 登録
   *
   * @param array $data 登録データ
   */
  public function store(array $data)
  {
    DB::transaction(function () use ($data) {
      Item::create($data);
    });
  }

  /**
   * 更新
   *
   * @param int $id 商品ID
   * @param array $data 更新データ
   */
  public function update(int $id, array $data)
  {
    $data = new Collection($data);
    DB::transaction(function () use ($id, $data) {
      $m = Item::find($id);
      $m->code = $data->get('code');
      $m->name = $data->get('name');
      $m->name = $data->get('name');
      $m->name_label = $data->get('name_label');
      $m->category_id = $data->get('category_id');
      $m->sales_unit_price = $data->get('sales_unit_price');
      $m->purchase_unit_price = $data->get('purchase_unit_price');
      $m->sample_price = $data->get('sample_price');
      $m->supplier_id = $data->get('supplier_id');

      $is_discontinued = $data->get('is_discontinued');
      $m->is_discontinued = $is_discontinued;
      $m->discontinued_at = $is_discontinued ? $data->get('discontinued_at') : null;

      $m->is_display = $data->get('is_display');
      $m->stock_display = $data->get('stock_display');
      $m->remarks = $data->get('remarks');
      $m->save();
    });
  }

  /**
   * 削除
   *
   * @param int $id 商品ID
   */
  public function delete(int $id)
  {
    DB::transaction(function () use ($id) {
      $m = Item::find($id);
      $m->forceDelete();
    });
  }

  /**
   * 品番からIDを取得する
   *
   * @param string $code
   * @return int|null
   */
  public function getIdFromItemNumber(string $code)
  {
    $item = Item::where('code', $code)->first();
    return $item ? $item->id : null;
  }

  /**
   * エクセル出力用のデータを取得する
   * 
   * @param array $cond 検索条件
   * @return Collection
   */
  public function getExcelData(array $cond)
  {
    $query = Item::select(
      'id',
      'code',
      'name',
      'name',
      'sales_unit_price',
      'purchase_unit_price',
    );
    $query = $this->setCondition($query, $cond);
    $query->orderBy('code', 'asc');
    return $query->get();
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
          $query->where('code', 'like', '%' . escape_like($key) . '%')
            ->orWhere('name', 'like', '%' . escape_like($key) . '%')
            ->orWhere('name', 'like', '%' . escape_like($key) . '%');
        });
      }
    }

    
    $c_is_display = $cond->get('c_is_display');
    if ($c_is_display !== "none") {
      $query->where('is_display', $c_is_display === "1");
    }

    $has_discontinued = $cond->get('c_has_discontinued');
    if (!$has_discontinued) {
      $query->whereNull('discontinued_at');
    }

    $c_supplier_id = $cond->get('c_supplier_id');
    if ($c_supplier_id) {
      $query->where('supplier_id', $c_supplier_id);
    }

    $c_un_supplier = $cond->get('c_un_supplier');
    if ($c_un_supplier) {
      $query->whereNull('supplier_id');
    }

    return $query;
  }
}