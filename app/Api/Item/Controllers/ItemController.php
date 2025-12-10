<?php

namespace App\Api\Item\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\Item\Requests\ItemStoreRequest;
use App\Api\Item\Requests\ItemUpdateRequest;
use App\Api\Item\Requests\ItemOutputRequest;
use App\Api\Item\Requests\ItemGetIdRequest;
use App\Api\Item\Requests\ItemGetDetailRequest;
use App\Api\Item\Services\ItemService;
use App\Api\Item\Services\ItemPdfService;
use App\Api\Item\Services\ItemExcelService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

/**
 * 商品マスタコントローラー
 */
class ItemController extends BaseController
{
  /** @var \App\Api\Item\Services\ItemService */
  protected $service;

  /**
   * @param \App\Api\Item\Services\ItemService $service
   */
  public function __construct(ItemService $service)
  {
    $this->service = $service;
  }

  /**
   * 検索画面
   */
  public function dialog(Request $request)
  {
    $input = $request->all();
    $data = $this->service->dialog($input);

    return $this->success($data);
  }

    /**
   * 検索画面
   */
  public function refdialog(Request $request)
  {
    $input = $request->all();
    $data = $this->service->dialog($input);

    return $this->success($data);
  }

  /**
   * 選択
   *
   * @param int $id 商品ID
   */
  public function selected(int $id)
  {
    $data = $this->service->selected($id);

    return $this->success($data);
  }

  /**
   * 一覧画面
   */
  public function fetch(Request $request)
  {
    $input = $request->all();
    $data = $this->service->fetch($input);

    return $this->success($data);
  }

  /**
   * 詳細画面
   *
   * @param int $id 商品ID
   */
  public function edit(int $id)
  {
    $data = $this->service->get($id);
    return $this->success($data);
  }

  /**
   * 登録
   */
  public function store(ItemStoreRequest $request)
  {
    $newId = $this->service->store($request->validated());

    return response()->json([
        'success' => true,
        'id' => $newId,
    ]);
  }

  /**
   * 更新
   *
   * @param int $id 商品ID
   */
  public function update(ItemUpdateRequest $request, int $id)
  {
    $this->service->update($id, $request->validated());
    return $this->success();
  }

  /**
   * 削除
   *
   * @param int $id 商品ID
   */
  public function delete(int $id)
  {
    try {
      $this->service->delete($id);
      return $this->success();
    } catch (QueryException $ex) {
      if ($ex->getCode() === '23000') {
        return $this->error("使用されているため、削除できません。");
      }
      throw $ex;
    }
  }

  /**
   * ラベル発行
   */
  public function output(ItemOutputRequest $request)
  {
    $pdf = new ItemPdfService();
    $pdf->isPrintPrice = $request->get('isPrintPrice', false);
    $file_id = $pdf->createPdf($request->validated());

    return $this->success([
      'file_id' => $file_id,
    ]);
  }

  /**
   * item_numberからIDを取得する
   */
  public function get_id(ItemGetIdRequest $request)
  {
    $data = new Collection($request->validated());
    $id = $this->service->getIdFromItemNumber($data->get('c_item_number'));

    if ($id) {
      return $this->success([
        'id' => $id
      ]);
    } else {
      return $this->error("", [
        "c_item_number" => "指定された品番は存在しないか削除されています",
      ]);
    }
  }

  /**
   * item_numberからitemを取得する
   */
  public function get_detail(ItemGetDetailRequest $request)
  {
    $data = new Collection($request->validated());
    $id = $this->service->getIdFromItemNumber($data->get('barcode'));
    $data = $this->service->selected($id);

    return $this->success($data);
  }
  
  /**
   * エクセル出力
   */
  public function output_excel(Request $request)
  {
    $input = $request->all();
    $rows = $this->service->getExcelData($input);

    $excel = new ItemExcelService();
    $file_id = $excel->createExcel($rows);
    return $this->success([
      'file_id' => $file_id,
    ]);
  }

  /**
   * 商品マスタ関連のデータをトランザクション処理にて一括登録する。
   */
  public function store_transaction(Request $request)
  {
    $data = $request->all();

    DB::beginTransaction();
    try {
      // バリエーション (variations) が空なら単一の Item を作成
      if (empty($data['variations'])) {
        Item::create([
          'name'        => $data['name'],
          'description' => $data['description'] ?? null,
          'category_id' => $data['category_id'] ?? null,
          // variations がない場合は共通情報のみ
        ]);
      } else {
        // バリエーション (variations) がある場合はループで Item を複数作成
        foreach ($data['variations'] as $variation) {
          Item::create([
            'name'        => $data['name'],
            'description' => $data['description'] ?? null,
            'category_id' => $data['category_id'] ?? null,
            'variations1' => $variation['variations1'] ?? null,
            'variations2' => $variation['variations2'] ?? null,
            'variations3' => $variation['variations3'] ?? null,
            'variations4' => $variation['variations4'] ?? null,
            'item_number' => $variation['item_number'] ?? null,
            'sales_price' => $variation['sales_price'] ?? 0,
          ]);
        }
      }

        /*
        // 1. Item テーブルに共通情報を保存
        $item = Item::create([
            'name'        => $data['name'],
            'description' => $data['description'] ?? null,
            'category_id' => $data['category_id'] ?? null,
            // 他の共通フィールドも必要に応じて追加
        ]);

        // 2. variations を ItemVariation テーブルに保存
        if (!empty($data['variations'])) {
            foreach ($data['variations'] as $variation) {
                ItemVariation::create([
                    'item_id'     => $item->id,
                    'variations1' => $variation['variations1'] ?? null,
                    'variations2' => $variation['variations2'] ?? null,
                    'variations3' => $variation['variations3'] ?? null,
                    'variations4' => $variation['variations4'] ?? null,
                    'item_number' => $variation['item_number'] ?? null,
                    'sales_price' => $variation['sales_price'] ?? 0,
                ]);
            }
        }
        */

        // 3. images があれば ItemImage テーブルに保存
        if (!empty($data['images'])) {
            foreach ($data['images'] as $imagePath) {
                ItemImage::create([
                    'item_id' => $item->id,
                    'path'    => $imagePath,
                ]);
            }
        }

        // 4. 他も同様に

        DB::commit();
        return response()->json(['success' => true]);
      } catch (Exception $e) {
          DB::rollBack();
          return response()->json([
              'success' => false,
              'error'   => $e->getMessage()
          ], 500);
      }
  }
}