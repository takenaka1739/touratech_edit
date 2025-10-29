<?php

namespace App\Api\Item\Services;

use App\Base\Models\Item;
use App\Base\Models\Image;
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
      'm_items.remarks',
      'm_items.number_reservations',
      'm_items.is_shipping_fee',
      'm_items.is_cash_delivery_fee',
      'm_items.additional_shipping_fee',
      'm_items.is_special_sale',
      'm_items.is_point_rebates',
      'm_items.is_payment_id1',
      'm_items.is_payment_id2',
      'm_items.is_payment_id3',
      'm_items.is_payment_id4',
      'm_items.is_payment_id5',
      //'m_categories.name',
      //'suppliers.name'
      //'item_classifications.name',
      //'suppliers.name',
      'm_categories.id AS category_id',
      'm_categories.name AS category_name',
      'm_suppliers.id AS supplier_id',
      'm_suppliers.name AS supplier_name',
      't_special_sales.is_sales_members_only AS is_sales_members_only',
      't_special_sales.start_at AS start_at',
      't_special_sales.end_at AS end_at',
      't_special_sales.special_sale_price AS special_sale_price',
      't_special_sales.refund_rate AS refund_rate'

      //'m_images.name AS image_name',

      
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
    ->leftJoin('m_suppliers', 'm_items.supplier_id', '=', 'm_suppliers.id')
    ->leftJoin('t_stocks', 'm_items.id', '=', 't_stocks.item_id')
    ->leftJoin('t_special_sales', 'm_items.id', '=', 't_special_sales.item_id')
    //->leftJoin('m_images', 'm_items.id', '=', 'm_images.item_id')
    ->where('m_items.id', '=', $id)
    ->first()
    //->get()
    ->toArray();
    //$a = Item::select('variations1')->where('code', '=', $selectItems['code'])->first();

    \log::debug('デバッグ：$selectItems');
    \log::debug($selectItems);

    $testArra = array();

    $variItems = [];
    $item1 = [];
    $item2 = [];
    $item3 = [];
    $item4 = [];
    $itemNumberItem = [];
    $salesPriceItem = [];
    $test = [];

    $a = [];
    $idList = [];
    $codeList = [];
    $specialSalesList = [];
    foreach(Item::where('code', '=', $selectItems['code'])->get() as $item){
      $b = [];
      $c = [];
      $b['id'] = $item->id;
      $b['supplier_id'] = $item->supplier_id;
      $b['consumption_tax_id'] = $item->consumption_tax_id;
      $b['code'] = $item->code;
      $b['name'] = $item->name;
      $b['item_number'] = $item->item_number;
      $b['variations1'] = $item->variations1;
      $b['variations2'] = $item->variations2;
      $b['variations3'] = $item->variations3;
      $b['variations4'] = $item->variations4;
      $b['explanation'] = $item->explanation;
      $b['explanation_details'] = $item->explanation_details;
      $b['name_note'] = $item->name_note;
      $b['name_label'] = $item->name_label;
      $b['is_sell'] = $item->is_sell;
      $b['purchase_price'] = $item->purchase_price;
      $b['sales_price'] = $item->sales_price;
      $b['sales_unit_price'] = $item->sales_unit_price;
      $b['purchase_unit_price'] = $item->purchase_unit_price;
      $b['sample_price'] = $item->sample_price;
      $b['is_discontinued'] = $item->is_discontinued;
      $b['discontinued_at'] = $item->discontinued_at;
      $b['is_display'] = $item->is_display;
      $b['overseas_stocks'] = $item->overseas_stocks;
      $b['display_status'] = $item->display_status;
      $b['remarks'] = $item->remarks;
      $b['is_point_rebates'] = $item->is_point_rebates;
      $b['number_reservations'] = $item->number_reservations;
      $b['is_shipping_fee'] = $item->is_shipping_fee;
      $b['is_cash_delivery_fee'] = $item->is_cash_delivery_fee;
      $b['additional_shipping_fee'] = $item->additional_shipping_fee;
      $b['is_special_sale'] = $item->is_special_sale;
      $b['is_payment_id1'] = $item->is_payment_id1;
      $b['is_payment_id2'] = $item->is_payment_id2;
      $b['is_payment_id3'] = $item->is_payment_id3;
      $b['is_payment_id4'] = $item->is_payment_id4;
      $b['is_payment_id5'] = $item->is_payment_id5;

      $b['category_id'] = $item->category_id;
      $b['supplier_id'] = $item->supplier_id;
      $b['domestic_stocks'] = $item->domestic_stocks;
      $b['overseas_stock'] = $item->overseas_stock;

      $c['is_sales_members_only'] = $item->is_sales_members_only;
      $c['is_sales_members_only'] = 't_special_sales.is_sales_members_only';
      $c['start_at'] = $item->start_at;
      $c['end_at'] = $item->end_at;
      $c['special_sale_price'] = $item->special_sale_price;
      $c['refund_rate'] = $item->refund_rate;
      \log::debug('デバッグ：$b');
      \log::debug($b);
      array_push($codeList, $b);
      array_push($specialSalesList, $c);

      array_push($idList, $item->id);
      $a = [];
      $index = array_search($item->variations1, array_column($test, 0));

      if($index === false){
        array_push($a, $item->variations1,
                       $item->variations2 === null ? '' : $item->variations2, 
                       $item->variations3 === null ? '' : $item->variations3,
                       $item->variations4 === null ? '' : $item->variations4,
                       $item->item_number === null ? '' : $item->item_number,
                       $item->sales_price === null ? '' : $item->sales_price);
        array_push($test, $a);
      }else{
        array_push($a, null,
                       $item->variations2 === null ? '' : $item->variations2, 
                       $item->variations3 === null ? '' : $item->variations3,
                       $item->variations4 === null ? '' : $item->variations4,
                       $item->item_number === null ? '' : $item->item_number,
                       $item->sales_price === null ? '' : $item->sales_price);
        array_splice($test, $index + 1, 0, [$a]);
      //array_push($a, $item->variations1,
      //               $item->variations2, 
      //               $item->variations3,
      //               $item->variations4,
      //               $item->sales_price);
      }
    //  //$testArra = [
    //  //  'vari1' => $item['variations1'],
    //  //  'vari2' => $item['variations2'],
    //  //  'vari3' => $item['variations3'],
    //  //  'vari4' => $item['variations4'],
    //  //  'itemNumber' => $item['item_number'],
    //  //  'salesPrice' => $item['sales_price']
    //  //];
//
      //array_push($test, $item);
      //array_push($test, $a);
    }

    //array_push($test, $a);

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

    $ss = [];
    $sss = [[]];
    $preId = -1;
    //foreach($idList as $id){
    //  $imageItem = Image::where('id', '=', '1')->get();
    //}

    foreach($idList as $id){
      foreach(Image::where('id', '=', $id)->get() as $item){
        if($item->name != null && $item->name != ''){
          if(strpos($item->image_name,'youtube')){
            array_push($ss, $item->name);
          }else{
            array_push($ss, '/images/' . $item->name);
          }
          array_push($sss, $ss);
        }
      }
    }

    //foreach(Item::select('m_images.name AS image_name')->leftJoin('m_images', 'm_items.id', '=', 'm_images.item_id')->get() as $item){
    //  $id = $item->item_id;
//
    //  if(strpos($item->image_name,'youtube')){
    //    array_push($ss, $item->image_name);
    //  }else{
    //    array_push($ss, '/images/' . $item->image_name);
    //  }
//
    //  if($id != $preId) {
    //  //array_push($sss, $ss);
    //  //array_push($ss, $id);
    //  //$ss = [];
    //  }
//
    //$preId = $id;
    //}
    //$selectItems['imageItem'] = $ss;

    $selectItems['codeList'] = $codeList;
    $selectItems['specialSalesList'] = $specialSalesList;
    $selectItems['variations1'] = '';
    $selectItems['variations2'] = '';
    $selectItems['variations3'] = '';
    $selectItems['variations4'] = '';
    $selectItems['itemNumberItem'] = $itemNumberItem;
    $selectItems['salesPriceItem'] = $salesPriceItem;
    //$selectItems['testArra'] = $testArra;
    $selectItems['testArra'] = $test;
    $selectItems['image_name'] = $sss;
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
      'm_items.id',
      'm_items.code',
      'm_items.name',
      'm_items.name',
      'm_items.item_number',
      'm_items.sales_unit_price',
      'm_items.purchase_unit_price',
      'm_categories.name AS item_classification_name',
    )
      ->leftJoin('m_categories', 'm_categories.id', '=', 'm_items.item_number')
      ->where('m_items.id', $id)
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
    \log::debug('ItemService.update');

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