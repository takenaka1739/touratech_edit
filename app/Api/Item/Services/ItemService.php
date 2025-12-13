<?php

namespace App\Api\Item\Services;

use App\Base\Models\Item;
use App\Base\Models\Image;
use App\Base\Models\ItemCategoryCombination;
use App\Base\Models\Category;
use App\Base\Models\Document;
use App\Base\Models\SpecialSale;
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
      'm_items.item_number',
      'm_items.name',
      'm_items.sales_unit_price',
      'm_items.purchase_unit_price',
    );
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
      'item_number',
      'code',
      'name',
      'sales_unit_price',
      'purchase_unit_price',
    );
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
    \Log::debug('fetch');
    $query = Item::select(
      'id',
      'code',
      'item_number',
      'name',
      'sales_unit_price',
      'variations1',
      'variations2',
      'variations3',
      'variations4',
      'purchase_unit_price',
    );
    $query = $this->setCondition($query, $cond);
    // 削除されていないレコードだけ取得
    $query->whereNull('deleted_at');

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
    \Log::debug('getの中だよ');
    //return 
    $selectItems = Item::select(
      'm_items.id',
      'm_items.supplier_id',
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
      'm_items.shipping_pay',
      'm_items.is_cash_delivery_fee',
      'm_items.additional_shipping_fee',
      'm_items.is_point_rebates',
      'm_items.is_payment_id1',
      'm_items.is_payment_id2',
      'm_items.is_payment_id3',
      'm_items.is_payment_id4',
      'm_items.is_payment_id5',
      'm_items.is_set_item',

      'm_suppliers.id AS supplier_id',
      'm_suppliers.name AS supplier_name',

      't_special_sales.id AS special_sale_id',
      't_special_sales.item_id AS special_sale_item_id',
      't_special_sales.is_sales_members_only AS is_sales_members_only',
      't_special_sales.start_at AS start_at',
      't_special_sales.end_at AS end_at',
      't_special_sales.special_sale_price AS special_sale_price',
      't_special_sales.refund_rate AS refund_rate',

      'm_configs.send_trader AS send_trader',
      'm_configs.send_personal AS send_personal',

      'm_documents.id AS document_id',
      'm_documents.type_status AS type_status',
      'm_documents.type_name AS type_name',
      'm_documents.file_name AS file_name'
    )

    ->leftJoin('m_configs', 'm_items.supplier_id', '=', 'm_configs.id')
    ->leftJoin('m_suppliers', 'm_items.supplier_id', '=', 'm_suppliers.id')
    ->leftJoin('m_documents', function($join) {
        $join->on('m_items.id', '=', 'm_documents.item_id')
             ->whereNull('m_documents.deleted_at');
    })

    ->leftJoin('t_special_sales', function ($join) {
        $join->on('m_items.id', '=', 't_special_sales.item_id')
    ->whereNull('t_special_sales.deleted_at');})
    ->where('m_items.id', '=', $id)
    ->first()
    ->toArray();

    $salesPriceItem = [];
    $test = [];

    $a = [];
    $idList = [];
    $codeList = [];
    $specialSalesList = [];
    $backVariItems = [];

    $c = [];
    $c['special_sale_id'] = $selectItems['special_sale_id'];
    $c['special_sale_item_id'] = $selectItems['special_sale_item_id'];
    $c['is_sales_members_only'] = $selectItems['is_sales_members_only'];
    $c['start_at'] = $selectItems['start_at'];
    $c['end_at'] = $selectItems['end_at'];
    $c['special_sale_price'] = $selectItems['special_sale_price'];
    $c['refund_rate'] = $selectItems['refund_rate'];
    array_push($specialSalesList, $c);

    $d = [];
    $category = [];
    $category_list = [];
    $category_list_all = [];
    $category_list = ItemCategoryCombination::where('item_id', $selectItems['id'])
        ->whereNull('t_category_item_combinations.deleted_at') // ★ ここで削除済みを除外
        ->join('m_categories', 't_category_item_combinations.category_id', '=', 'm_categories.id')
        ->select(
            't_category_item_combinations.id as combId',
            'm_categories.id as categoryId',
            'm_categories.name'
        )
        ->get()
        ->unique('categoryId')
        ->map(function ($row) {
            return [
                'combId' => $row->combId,
                'categoryId' => $row->categoryId,
                'name' => $row->name,
                'status' => 'no update',
                'initialcategoryId' => $row->categoryId,
            ];
        })
        ->values()
        ->toArray();

    // ★ 空だった場合はダミー行を追加
    if (empty($category_list)) {
        $category_list = [[
            'combId' => null,
            'categoryId' => null,
            'name' => '',   // 表示用に文字を入れると分かりやすい
            'status' => 'new1',      // フロント側が認識できる値にする
            'initialcategoryId' => null,
        ]];
    }

    $documentFileList = [];

    foreach(Item::where('code', '=', $selectItems['code'])->get() as $item){
      $category_list_key = [];
      $category = [];
      $category = ItemCategoryCombination::where('item_id', $item->id)
          ->whereNull('t_category_item_combinations.deleted_at')
          ->join('m_categories', 't_category_item_combinations.category_id', '=', 'm_categories.id')
          ->select(
              't_category_item_combinations.id as combId',
              't_category_item_combinations.item_id as itemId',
              'm_categories.id as categoryId',
              'm_categories.name'
          )
          ->get()
          ->unique('categoryId')
          ->map(function ($row) {
              return [
                  'combId' => $row->combId,
                  'itemId' => $row->itemId,
                  'categoryId' => $row->categoryId,
                  'name' => $row->name,
                  'status' => 'no update',
                  'initialcategoryId' => $row->categoryId,
              ];
          })
          ->values()
          ->toArray();
        
      // ★ 空だった場合はダミー行を追加
      if (empty($category)) {
          $category = [[
              'combId' => null,
              'itemId' => $selectItems['id'], // ← ダミーでも itemId を入れておくとキーにできる
              'categoryId' => null,
              'name' => '',
              'status' => 'new1',
              'initialcategoryId' => null,
          ]];
      }

      // ★ itemId をキーにして格納
      $itemId = $category[0]['itemId']; // 先頭の itemId をキーにする
      $category_list_key[$item->id] = $category;
      array_push($category_list_all, $category_list_key);

      array_push($d, ItemCategoryCombination::where('item_id', '=', $item->id)->first());

      array_push($documentFileList, Document::where('item_id', $item->id)
                  ->whereNull('deleted_at')
                  ->first());

      array_push($codeList, $item);

      array_push($idList, $item->id);
      $a = [];
      $b = [];
      array_push($a, $item->id,
                     $item->variations1 === null ? '' : $item->variations1, 
                     $item->variations2 === null ? '' : $item->variations2, 
                     $item->variations3 === null ? '' : $item->variations3,
                     $item->variations4 === null ? '' : $item->variations4,
                     $item->item_number === null ? '' : $item->item_number,
                     $item->sales_price === null ? '' : $item->sales_price);

      array_push($b, $item->id,
                     $item->variations1, 
                     $item->variations2, 
                     $item->variations3,
                     $item->variations4,
                     $item->item_number,
                     $item->sales_price);
      array_push($test, $a);
      array_push($backVariItems, $b);
    }

    // バリデーションの配列のソート処理（1～4で優先順位（昇順））
    $sorted = collect($test)->sort(function ($row1, $row2) {
      // 優先順位: row[1] > row[2] > row[3] > row[4]
      foreach ([1, 2, 3, 4] as $idx) {
        $row1col = $row1[$idx];
        $row2col = $row2[$idx];

        // null / 空文字は並び順の最後にもってくる
        $empty1 = ($row1col === null || $row1col === '');
        $empty2 = ($row2col === null || $row2col === '');

        if ($empty1 && !$empty2) return 1;
        if (!$empty1 && $empty2) return -1;

        // 両方空なら次のキーへ
        if ($empty1 && $empty2) continue;

        // 通常の文字列比較
        if ($row1col < $row2col) return -1;
        if ($row1col > $row2col) return 1;
      }
      return 0;
    })->values();

    if(count($sorted) > 1){
      $previous = ['', '', '', ''];
      $variItems = $sorted->map(function ($row) use (&$previous) {
          for ($i = 1; $i <= 4; $i++) {
            if ($row[$i] === $previous[$i - 1]) {
              $row[$i] = null;
            } else {
              $previous[$i - 1] = $row[$i];
            }
          }
          return $row;
      })->all();

      $variItems = array_map(function ($row) {
        $count = count($row);
        for ($i = 0; $i < $count; $i++) {          
            // 前の要素が null で、今が空白なら null にする
            if ($i > 0 && is_null($row[$i - 1]) && $row[$i] === '') {
              $row[$i] = null;
            }else{
              // 前が null ではなく、今が null なら空白にする
              if ($i > 0 && !is_null($row[$i - 1]) && is_null($row[$i])) {
                  $row[$i] = '';
              }
            }

            // 1番目が空白なら null にする
            if ($i === 1 && $row[$i] === '') {
                $row[$i] = null;
                continue;
            }
        }
        return $row;
      }, $variItems);
    }else{
      $variItems = $sorted->map(function ($row) use (&$previous) {
          for ($i = 1; $i <= 4; $i++) {
            if ($row[$i] === null) {
              $row[$i] = '';
            }
          }
          return $row;
      })->all();
    }

    foreach(Item::select('sales_price')->where('code', '=', $selectItems['code'])->get() as $item){
      array_push($salesPriceItem, $item['sales_price']);
    }

    $ss = [];
    $sss = [];
    $ssss = [];
    $preId = -1;

    foreach($idList as $id){
      $ss = [];
      array_push($ss, $id);
      foreach(Image::where('item_id', '=', $id)->whereNull('deleted_at')->get() as $item){
        if($item->name != null && $item->name != ''){
          array_push($ssss, [$item->id, $id, $item->name, $item->order_by]);   // m_imagesの管理ID, item_id, ファイル名の順番
          if(preg_match('/https?:\/\/(www\.)?youtube\.com\/embed\//', $item->name)){
            array_push($ss, $item->name);
          }else{
            //array_push($ss, 'http://localhost:8081/storage/images/' . $item->name);
            array_push($ss, '/images/' . $item->name);
          }
        }
      }
      array_push($sss, $ss);
    }

    if (count($variItems) < 1) {
      $variItems = [
        ['new1', '', '', '', '', '', '']
      ];
    }
  
    $selectItems['sales_price'] = count($variItems) > 1 ? 0 : $selectItems['sales_price'];
    $selectItems['type_status'] = $selectItems['type_status'] === null || $selectItems['type_status'] === '' ? 0 : $selectItems['type_status'];
    $selectItems['codeList'] = $codeList;
    $selectItems['categoryList'] = $category_list;
    $selectItems['categoryListAll'] = $category_list_all;
    $selectItems['specialSalesList'] = $specialSalesList;
    $selectItems['salesPriceItem'] = $salesPriceItem;
    $selectItems['variItems'] = $variItems;
    $selectItems['backVariItems'] = $backVariItems;
    $selectItems['imageList'] = $sss;
    $selectItems['preImageList'] = $ssss;
    $selectItems['combIdList'] = $d;
    $selectItems['is_display'] = $selectItems['is_display'] !== true ? false : $selectItems['is_display'];
    $selectItems['document_url'] = $selectItems['file_name'] !== '' ? '/files/' . $selectItems['file_name'] : '';
    $selectItems['documentFileList'] = $documentFileList;
    if($selectItems['shipping_pay'] === null){
      if($selectItems['display_status'] === 1) $selectItems['shipping_pay'] = $selectItems['send_personal'];
      elseif($selectItems['display_status'] === 2) $selectItems['shipping_pay'] = $selectItems['send_trader'];
    }
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
    $data['domestic_stocks'] = $data['domestic_stocks'] ?? 0;
    $data['overseas_stocks'] = $data['overseas_stocks'] ?? 0;
    $data['is_set_item'] = false;
    $data['sales_unit_price'] = $data['sales_unit_price'] ?? 0;
    $data['purchase_unit_price'] = $data['purchase_unit_price'] ?? 0;
    $newId = DB::transaction(function () use ($data) {
        $item = Item::create($data);

        return $item->id; // ← これがそのまま $newId に入る
    });

    return $newId;
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
      $m->name_label = $data->get('name_label');
      $m->name_note = $data->get('name_note');
      $m->variations1 = $data->get('variations1');
      $m->variations2 = $data->get('variations2');
      $m->variations3 = $data->get('variations3');
      $m->variations4 = $data->get('variations4');
      $m->sales_price = $data->get('sales_price');
      $m->display_status = $data->get('display_status');
      $m->additional_shipping_fee = $data->get('additional_shipping_fee');
      $m->purchase_price = $data->get('purchase_price');
      $m->is_set_item = $data->get('is_set_item');
      $m->sales_unit_price = $data->get('sales_unit_price') ?? 0;
      $m->purchase_unit_price = $data->get('purchase_unit_price') ?? 0;
      $m->sample_price = $data->get('sample_price');
      $m->supplier_id = $data->get('supplier_id');
      $m->item_number = $data->get('item_number');
      $m->explanation = $data->get('explanation');
      $m->explanation_details = $data->get('explanation_details');
      $is_discontinued = $data->get('is_discontinued');
      $m->is_discontinued = $is_discontinued;
      $m->discontinued_at = $is_discontinued ? $data->get('discontinued_at') : null;

      $m->is_point_rebates = $data->get('is_point_rebates');
      $m->number_reservations = $data->get('number_reservations');
      $m->is_shipping_fee = $data->get('is_shipping_fee');
      $m->shipping_pay = $data->get('shipping_pay');
      $m->is_sell = $data->get('is_sell');
      $m->is_cash_delivery_fee = $data->get('is_cash_delivery_fee');

      $m->is_display = $data->get('is_display');
      $m->remarks = $data->get('remarks');
      $m->is_payment_id1 = $data->get('is_payment_id1');
      $m->is_payment_id2 = $data->get('is_payment_id2');
      $m->is_payment_id3 = $data->get('is_payment_id3');
      $m->is_payment_id4 = $data->get('is_payment_id4');
      $m->is_payment_id5 = $data->get('is_payment_id5');
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
        if ($m) {
            $m->delete();   // ← ソフトデリートに変更
        }
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
            ->orWhere('item_number', 'like', '%' . escape_like($key) . '%');
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

  /**
   * m_items の共通部分を生成する。
   * 共通部分以外とはバリエーションの有無により、取得先が変わるものを指す。
   * 新規登録時、更新時の両方で使用する。
   */
  private function buildItemBase(array $data): array
  {
    return [
      'supplier_id'            => $data['supplier_id'] ?? null,
      'code'                   => $data['code'] ?? null,
      // item_number はバリエーションの有無により取得先が異なる
      'name'                   => $data['name'],
      // variations1～5はバリエーションがある時のみ必要
      'explanation'            => $data['explanation'] ?? null,
      'explanation_details'    => $data['explanation_details'] ?? null,
      'name_note'              => $data['name_note'] ?? null,
      'name_label'             => $data['name_label'] ?? null,
      'is_sell'                => $data['is_sell'] ?? false,
      'purchase_price'         => $data['purchase_price'] ?? 0,
      // sales_price はバリエーションの有無により取得先が異なる
      'sales_unit_price'       => $data['sales_unit_price'] ?? 0,
      'purchase_unit_price'    => $data['purchase_unit_price'] ?? 0,
      'sample_price'           => $data['sample_price'] ?? 0,
      'discontinued_at'        => $data['discontinued_at'] ?? null,
      'is_discontinued'        => $data['is_discontinued'] ?? false,
      'is_display'             => $data['is_display'] ?? true,
      'domestic_stocks'        => $data['domestic_stocks'] ?? 0,
      'overseas_stocks'        => $data['overseas_stocks'] ?? 0,
      'display_status'         => $data['display_status'] ?? null,
      'is_point_rebates'       => $data['is_point_rebates'] ?? false,
      'number_reservations'    => $data['number_reservations'] ?? 0,
      'is_shipping_fee'        => $data['is_shipping_fee'] ?? false,
      'shipping_pay'           => $data['shipping_pay'] ?? 0,
      'is_cash_delivery_fee'   => $data['is_cash_delivery_fee'] ?? false,
      'additional_shipping_fee'=> $data['additional_shipping_fee'] ?? 0,
      'is_payment_id1'         => $data['is_payment_id1'] ?? false,
      'is_payment_id2'         => $data['is_payment_id2'] ?? false,
      'is_payment_id3'         => $data['is_payment_id3'] ?? false,
      'is_payment_id4'         => $data['is_payment_id4'] ?? false,
      'is_payment_id5'         => $data['is_payment_id5'] ?? false,
      'remarks'                => $data['remarks'] ?? null,
      'is_set_item'            => $data['is_set_item'] ?? false,
    ];
  }

  /**
   * m_items のバリエーション情報を生成する。
   */
  private function buildVariationAttributes(array $variation, array $prevVariations, array $base): array
  {
    return $base + [
      'variations1' => $variation[1] ?? $prevVariations['variations1'],
      'variations2' => $variation[2] ?? $prevVariations['variations2'],
      'variations3' => $variation[3] ?? $prevVariations['variations3'],
      'variations4' => $variation[4] ?? $prevVariations['variations4'],
      'item_number' => $variation[5] ?? null,
      'sales_price' => $variation[6] ?? 0,
    ];
  }

  /**
   * バリエーションの前回値保持用の配列を初期化する。
   */
  private function initPrevVariations(): array
  {
    return [
      'variations1' => null,
      'variations2' => null,
      'variations3' => null,
      'variations4' => null,
    ];
  }

  /**
   * バリエーションの前回値を更新する。
   */
  private function updatePrevVariations(array &$prevVariations, array $variation): void
  {
    $prevVariations['variations1'] = $variation[1] ?? null;
    $prevVariations['variations2'] = $variation[2] ?? null;
    $prevVariations['variations3'] = $variation[3] ?? null;
    $prevVariations['variations4'] = $variation[4] ?? null;
  }

  /**
   * 商品マスタに関連するテーブルに一括登録する。
   */
  public function storeTransaction(array $data): array
  {
    return DB::transaction(function () use ($data) {
      $ids = [];

      // 共通部を取得
      $base = $this->buildItemBase($data);

      \Log::debug('$data');
      \Log::debug($data);

      // バリエーションなし
      if (empty($data['variItems'])) {
        $item = Item::create($base + [
          'item_number' => $data['item_number'] ?? null,
          'sales_price' => $data['sales_price'] ?? 0,
        ]);
        $ids[] = $item->id;

        // Image （商品画像・動画・YouTubeリンク）登録（Itemごとに複数件）
        if (!empty($data['images'][0])) {
          $imageRow = $data['images'][0];

          // 要素0は item_id、要素1～はファイル名
          foreach (array_values(array_slice($imageRow, 1)) as $order => $fileName) {
            Image::create([
              'item_id'     => $item->id,
              'category_id' => null,
              'name'        => $fileName,
              'order_by'    => $order,
            ]);
          }
        }

        // Document 登録（Itemごとに必ず1件）
        Document::create([
          'item_id'     => $item->id,
          'type_status' => $data['type_status'] ?? 0,
          'type_name'   => $data['type_name'] ?? '',
          'file_name'   => $data['file_name'] ?? '',
        ]);

        // SpecialSale 登録 (start_at(特売開始日)がnullだったら登録しない, Itemごとに1件)
        if($data['start_at'] !== null) {
          SpecialSale::create([
            'item_id'               => $item->id,
            'is_sales_members_only' => $data['is_sales_members_only'] ?? false,
            'start_at'              => $data['start_at'] ?? null,
            'end_at'                => $data['end_at'] ?? null,
            'special_sale_price'    => $data['special_sale_price'] ?? 0,
            'refund_rate'           => $data['refund_rate'] ?? 0,
          ]);
        }

        // ItemCategoryCombination 登録 (Itemごとに複数件)
        foreach ($data['categoryList'] as $category) {
          \Log::debug($category);
          ItemCategoryCombination::create([
            'item_id'     => $item->id,
            'category_id' => $category['categoryId'],
          ]);
        }

      // バリエーションあり
      } else {

        // 前回の variItems 値を保持する変数
        $prevVariations = [
            'variations1' => null,
            'variations2' => null,
            'variations3' => null,
            'variations4' => null,
        ];

        foreach ($data['variItems'] as $index => $variation) {
          // バリエーション関連
          $variationAttributes = $this->buildVariationAttributes($variation, $prevVariations, $base);
          $item = Item::create($variationAttributes);                 // 新規バリエーションのため m_items 新規登録
          $this->updatePrevVariations($prevVariations, $variation);   // バリエーションの前回値の更新
          $ids[] = $item->id;                                         // m_items の新規登録ID

          \Log::debug($data);

          // Image （商品画像・動画・YouTubeリンク）登録（Itemごとに複数件）
          if (!empty($data['images'][$index])) {
            $imageRow = $data['images'][$index];

            // 要素0は item_id、要素1～はファイル名
            foreach (array_slice($imageRow, 1) as $order => $fileName) {
              Image::create([
                'item_id'     => $item->id,
                'category_id' => null,
                'name'        => $fileName,
                'order_by'    => $order,
              ]);
            }
          }

          // Document 登録（Itemごとに必ず1件）
          Document::create([
            'item_id'     => $item->id,
            'type_status' => $data['type_status'] ?? 0,
            'type_name'   => $data['type_name'] ?? '',
            'file_name'   => $data['file_name'] ?? '',
          ]);

          // SpecialSale 登録 (start_at(特売開始日)がnullだったら登録しない, Itemごとに1件)
          if($data['start_at'] !== null) {
            SpecialSale::create([
              'item_id'               => $item->id,
              'is_sales_members_only' => $data['is_sales_members_only'] ?? false,
              'start_at'              => $data['start_at'] ?? null,
              'end_at'                => $data['end_at'] ?? null,
              'special_sale_price'    => $data['special_sale_price'] ?? 0,
              'refund_rate'           => $data['refund_rate'] ?? 0,
            ]);
          }

          // ItemCategoryCombination 登録 (Itemごとに複数件)
          foreach ($data['categoryList'] as $category) {
            ItemCategoryCombination::create([
              'item_id'     => $item->id,
              'category_id' => $category['categoryId'],
            ]);
          }
        }
      }

      return $ids;
    });
  }

  /**
   * 商品マスタに関連するテーブルに一括更新する。
   */
  public function updateTransaction(array $data): array
  {
    \Log::debug('$data1');
    \Log::debug($data);

    return DB::transaction(function () use ($data) {
      $ids = [];

      // 共通部を取得
      $base = $this->buildItemBase($data);

      // 編集前の状態をDBから取得（codeカラムで判定）
      $beforeVariations = Item::where('code', $data['code'])->get();

      // 更新後のID一覧を作成
      // 0：id、1：バリエーション1、2：バリエーション2、3：バリエーション3、4：バリエーション4、5：品番、6：販売価格
      $afterIds = empty($data['variItems']) ? [$data['id']] : collect($data['variItems'])->map(fn($v) => $v[0])->filter()->all();
      
      // 削除対象（更新前に存在 → 更新後に存在しない）
      $deletedItems = $beforeVariations->whereNotIn('id', $afterIds);
      foreach ($deletedItems as $deleteItem) {
          $deleteItem->update(['deleted_at' => now()]);
      }

      \Log::debug('$data2');
      \Log::debug($data);

      // バリエーションなし
      if (empty($data['variItems'])) {
        $item = Item::findOrFail($data['id']);
        $item->update($base + [
          'item_number' => $data['item_number'] ?? null,
          'sales_price' => $data['sales_price'] ?? 0,
        ]);
        $ids[] = $item->id;

        // Image を更新／新規作成
        $beforeImages = Image::where('item_id', $item->id)->get();
        $afterImageIds = collect($data['images'] ?? [])->map(fn($img) => $img['id'])->filter()->all();
        $deletedImages = $beforeImages->whereNotIn('id', $afterImageIds);
        foreach ($deletedImages as $deleteImage) {
          $deleteImage->update(['deleted_at' => now()]);
        }
        foreach ($data['images'] ?? [] as $imgData) {
          if (!empty($imgData['id'])) {
            $image = Image::findOrFail($imgData['id']);
            $image->update([
              'item_id'   => $item->id,
              'file_path' => $imgData['file_path'] ?? '',
              'caption'   => $imgData['caption'] ?? '',
            ]);
          } else {
            Image::create([
              'item_id'   => $item->id,
              'file_path' => $imgData['file_path'] ?? '',
              'caption'   => $imgData['caption'] ?? '',
            ]);
          }
        }

        // Document を更新／新規作成
        Document::updateOrCreate(
          ['item_id' => $item->id],
          [
            'type_status' => $data['type_status'] ?? 0,
            'type_name'   => $data['type_name'] ?? '',
            'file_name'   => $data['file_name'] ?? '',
          ]
        );

      // バリエーションあり
      } else {
        // 前回の variations 値を保持する変数
        $prevVariations = [
          'variations1' => null,
          'variations2' => null,
          'variations3' => null,
          'variations4' => null,
        ];

        foreach ($data['variItems'] as $variation) {
          // バリエーション情報の設定
          $variationAttributes = $this->buildVariationAttributes($variation, $prevVariations, $base);

          // 既存のバリエーションのため m_items 更新
          if (!empty($variation[0])) {
            $item = Item::findOrFail($variation[0]);
            $item->update($variationAttributes);
          
          // 新規バリエーションのため m_items 新規登録
          } else {
            $item = Item::create($variationAttributes);
          }

          // バリエーションの前回値の更新
          $this->updatePrevVariations($prevVariations, $variation);

          // Image の更新／削除
          $beforeImages = Image::where('item_id', $item->id)->get();
          $afterImageIds = collect($data['images'] ?? [])->map(fn($img) => $img['id'])->filter()->all();
          $deletedImages = $beforeImages->whereNotIn('id', $afterImageIds);
          foreach ($deletedImages as $deleteImage) {
            $deleteImage->update(['deleted_at' => now()]);
          }
          foreach ($data['images'] ?? [] as $imgData) {
            if (!empty($imgData['id'])) {
              $image = Image::findOrFail($imgData['id']);
              $image->update([
                'item_id'   => $item->id,
                'file_path' => $imgData['file_path'] ?? '',
                'caption'   => $imgData['caption'] ?? '',
              ]);
            } else {
              Image::create([
                'item_id'   => $item->id,
                'file_path' => $imgData['file_path'] ?? '',
                'caption'   => $imgData['caption'] ?? '',
              ]);
            }
          }

          // Document を更新／新規作成
          Document::updateOrCreate(
            ['item_id' => $item->id],
            [
              'type_status' => $data['type_status'] ?? 0,
              'type_name'   => $data['type_name'] ?? '',
              'file_name'   => $data['file_name'] ?? '',
            ]
          );

          $ids[] = $item->id;
        }
      }
      
      return $ids;
    });
  }
}