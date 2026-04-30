<?php

namespace App\Api\Estimate\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\Estimate\Requests\EstimateStoreRequest;
use App\Api\Estimate\Requests\EstimateUpdateRequest;
use App\Api\Estimate\Requests\EstimateDetailRequest;
use App\Api\Estimate\Services\EstimateService;
use App\Api\Estimate\Services\EstimatePdfService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB; //  追加

/**
 * 見積データコントローラー
 */
class EstimateController extends BaseController
{
  /** @var \App\Api\Estimate\Services\EstimateService */
  protected $service;

  /**
   * @param \App\Api\Estimate\Services\EstimateService $service
   */
  public function __construct(EstimateService $service)
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
   * 選択
   *
   * @param int $id 見積ID
   */
  public function selected(int $id)
  {
    $data = $this->service->get($id);

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
   * @param int $id 見積ID
   */
  public function edit($id = null)
  {
    if ($id) {
      $data = $this->service->get($id);
    } else {
      $data = $this->service->newData();
    }

    return $this->success($data);
  }

  /**
   * 登録
   */
  public function store(EstimateStoreRequest $request)
  {
    $id = $this->service->store($request->validated());

    return $this->success([
      'id' => $id,
    ]);
  }

  /**
   * 更新
   *
   * @param int $id 見積ID
   */
  public function update(EstimateUpdateRequest $request, int $id)
  {
    if ($this->service->hasReceiveOrder($id)) {
      return $this->error("", [
        'has_receive_order' => '既に受注データが存在するため、データの編集は出来ません。',
      ]);
    }

    $this->service->update($id, $request->validated());

    return $this->success();
  }

  /**
   * 削除
   *
   * @param int $id 見積ID
   */
  public function delete(int $id)
  {
    if ($this->service->hasReceiveOrder($id)) {
      return $this->error("", [
        'has_receive_order' => '既に受注データが存在するため、データの編集は出来ません。',
      ]);
    }

    $this->service->delete($id);

    return $this->success();
  }

  /**
   * 明細（バリデーション）
   */
  public function detail(EstimateDetailRequest $request)
  {
    return $this->success();
  }

  /**
   * 見積書印刷
   */
  public function output(EstimateUpdateRequest $request)
  {
    // ★重要：validated() では id が落ちることがあるため、先に生で取得する
    $estimateId =
      $request->input('id')
      ?? $request->route('id')
      ?? null;

    $cond = $request->validated();

    // getPdfData は config_data を足すだけなので、id を明示的に載せる
    if ($estimateId !== null) {
      $cond['id'] = $estimateId;
    }

    $data = $this->service->getPdfData($cond);

    // ★ここでIDが取れていないと、DBからdiscount_amount付きで取れないのでログで即検知
    logger()->info('pdf details meta', [
      'estimate_id' => $estimateId,
      'db' => DB::connection()->getDatabaseName(),
      'req_id' => $request->input('id'),
      'route_id' => $request->route('id'),
    ]);

    if ($estimateId) {
      // 親（値引・備考）
      $extra = DB::table('t_estimates')
        ->where('id', $estimateId)
        ->first();

      if ($extra) {
        $data = array_merge($data, (array)$extra);
      }

      // ★明細：discount_amount を必ずキーとして返す（NULLでも0で返す）
      $data['details'] = DB::table('t_estimate_details')
        ->select([
          'id',
          'estimate_id',
          'no',
          'item_kind',
          'item_id',
          'item_number',
          'item_name',
          'item_name_jp',
          'sales_unit_price',
          'rate',
          'fraction',
          'unit_price',
          'quantity',
          'amount',
          'sales_tax_rate',
          'sales_tax',
          'parent_id',
          DB::raw('COALESCE(discount, 0) as discount'),
        ])
        ->where('estimate_id', $estimateId)
        ->whereIn('item_kind', [1, 2])
        ->orderBy('no')
        ->get()
        ->toArray();
    }

    $first = $data['details'][0] ?? null;
    logger()->info('pdf details first row keys', [
      'keys' => $first ? array_keys((array)$first) : [],
      'first' => $first,
    ]);

    $pdf = new EstimatePdfService();
    $file_id = $pdf->createPdf($data);

    return $this->success([
      'file_id' => $file_id,
    ]);
  }
}
