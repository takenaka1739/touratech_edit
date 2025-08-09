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
      'm_items.id',
      'm_items.code',
      'm_items.name',
      //'name',
      'm_items.sales_unit_price',
      'm_items.purchase_unit_price',

      //'id',
      //'code',
      //'name',
      //'name',
      //'sales_unit_price',
      //'purchase_unit_price',
    );
    //$query = $this->setCondition($query, $cond);
    $query->orderBy('code', 'asc');
    return $query->paginate(config('const.paginate.per_page'))->toArray();
  }

  /**
   * 検索画面用の一覧データを取得する
   *
   * @return array
   */
  public function refDialog()
  {
    $query = Item::select(
      'id',
      'code',
      'name',
      'sales_unit_price',
      'purchase_unit_price',

      //'id',
      //'code',
      //'name',
      //'name',
      //'sales_unit_price',
      //'purchase_unit_price',
    );
    //$query = $this->setCondition($query, $cond);
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
      //'variation_code1',
      'item_number',
      'name',
      'name',
      'sales_unit_price',
      'purchase_unit_price',
    );
    $query = $this->setCondition($query, $cond);
    $query->orderBy('code', 'asc');
    return $query->paginate(config('const.paginate.per_page'))->toArray();
  }

  function group_by(array $table, string $key): array
  {
  	$groups = [];
  	foreach ($table as $row) {
  		$groups[$row[$key]][] = $row;
  	}
  	return $groups;
  }

  /**
   * 詳細データを取得する
   *
   * @param int $id 商品ID
   * @return array
   */
  public function get(int $id)
  {
    //return 
    $selectItems = Item::select(
      'm_items.id',
      'm_items.supplier_id',
      'm_items.consumption_tax_id',
      'm_items.code',
      'm_items.name',
      'm_items.item_number',
      'm_items.variations1',
      'm_items.variations2',
      'm_items.variations3',
      'm_items.variations4',
      'm_items.explanation',
      'm_items.explanation_details',
      'm_items.name_note',
      'm_items.name_label',
      'm_items.is_sell',
      'm_items.purchase_price',
      'm_items.sales_price',
      'm_items.sales_unit_price',
      'm_items.purchase_unit_price',
      'm_items.sample_price',
      'm_items.is_discontinued',
      'm_items.discontinued_at',
      'm_items.is_display',
      'm_items.domestic_stocks',
      'm_items.overseas_stocks',
      'm_items.display_status',
      'm_items.is_point_rebates',
      'm_items.number_reservations',
      'm_items.is_shipping_fee',
      'm_items.is_cash_delivery_fee',
      'm_items.additional_shipping_fee',
      'm_items.is_special_sale',
      'm_items.is_payment_id1',
      'm_items.is_payment_id2',
      'm_items.is_payment_id3',
      'm_items.is_payment_id4',
      'm_items.is_payment_id5',
      //'m_categories.name',
      //'suppliers.name'
      //'item_classifications.name',
      //'suppliers.name',
      'm_categories.name AS category_name',
      'suppliers.name AS supplier_name',
      't_stocks.domestic_stocks AS domestic_stock',
      't_stocks.overseas_stocks AS overseas_stock'
      
      //'id',
      //'code',
      //'name',
      //'name',
      //'name_label',
      //'category_id',
      //'sales_unit_price',
      //'purchase_unit_price',
      //'sample_price',
      //'supplier_id',
      //'is_discontinued',
      //'discontinued_at',
      //'is_display',
      //'stock_display',
      //'remarks',

      //'items.id',
      //'items.code',
      //'items.name',
      //'items.name',
      //'items.name_label',
      //'items.category_id',
      //'items.sales_unit_price',
      //'items.purchase_unit_price',
      //'items.sample_price',
      //'items.supplier_id',
      //'items.is_discontinued',
      //'items.discontinued_at',
      //'items.is_display',
      //'items.stock_display',
      //'items.remarks',
      //'item_classifications.name AS item_classification_name',
      //'suppliers.name AS supplier_name',
    )
      //->leftJoin('item_classifications', 'item_classifications.id', '=', 'items.category_id')
      //->leftJoin('suppliers', 'suppliers.id', '=', 'items.supplier_id')
      //->where('items.id', $id)
      //->first()
      //->get()
      //->toArray();

    ->leftJoin('t_category_item_combinations', 'm_items.id', '=', 't_category_item_combinations.item_id')
    ->leftJoin('m_categories', 't_category_item_combinations.category_id', '=', 'm_categories.id')
    //->leftJoin('item_classifications', 'item_classifications.id', '=', 'items.category_id')
    ->leftJoin('suppliers', 'm_items.supplier_id', '=', 'suppliers.id')
    ->leftJoin('t_stocks', 'm_items.id', '=', 't_stocks.item_id')
    ->where('m_items.id', '=', $id)
    ->first()
    //->get()
    ->toArray();
    //$a = Item::select('variations1')->where('code', '=', $selectItems['code'])->first();

    $testArra = array();

    $variItems = [];
    $item1 = [];
    $item2 = [];
    $item3 = [];
    $item4 = [];
    $itemNumberItem = [];
    $salesPriceItem = [];

    foreach(Item::where('code', '=', $selectItems['code'])->get() as $item){
      $testArra = [
        'vari1' => $item['variations1'],
        'vari2' => $item['variations2'],
        'vari3' => $item['variations3'],
        'vari4' => $item['variations4'],
        'itemNumber' => $item['item_number'],
        'salesPrice' => $item['sales_price']
      ];

      //array_push($test, $testArra);
    }

    //$test = group_by($test, 'vari1');

    foreach(Item::select('variations1')->where('code', '=', $selectItems['code'])->get() as $item){
      array_push($item1, $item['variations1']);
    }

    foreach(Item::select('variations2')->where('code', '=', $selectItems['code'])->get() as $item){
      array_push($item2, $item['variations2']);
    }

    foreach(Item::select('variations3')->where('code', '=', $selectItems['code'])->get() as $item){
      array_push($item3, $item['variations3']);
    }

    foreach(Item::select('variations4')->where('code', '=', $selectItems['code'])->get() as $item){
      array_push($item4, $item['variations4']);
    }

    foreach(Item::select('item_number')->where('code', '=', $selectItems['code'])->get() as $item){
      array_push($itemNumberItem, $item['item_number']);
    }

    foreach(Item::select('sales_price')->where('code', '=', $selectItems['code'])->get() as $item){
      array_push($salesPriceItem, $item['sales_price']);
    }

    $selectItems['variations1'] = $item1;
    $selectItems['variations2'] = $item2;
    $selectItems['variations3'] = $item3;
    $selectItems['variations4'] = $item4;
    $selectItems['itemNumberItem'] = $itemNumberItem;
    $selectItems['salesPriceItem'] = $salesPriceItem;
    $selectItems['testArra'] = $testArra;

    return $selectItems;
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