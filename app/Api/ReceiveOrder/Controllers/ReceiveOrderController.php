<?php

namespace App\Api\ReceiveOrder\Controllers;

use App\Api\PlaceOrder\Services\PlaceOrderService;
use App\Base\Http\Controllers\Api\BaseController;
use App\Api\ReceiveOrder\Requests\ReceiveOrderStoreRequest;
use App\Api\ReceiveOrder\Requests\ReceiveOrderUpdateRequest;
use App\Api\ReceiveOrder\Requests\ReceiveOrderDetailRequest;
use App\Api\ReceiveOrder\Requests\ReceiveOrderOutputRequest;
use App\Api\ReceiveOrder\Services\ReceiveOrderService;
use App\Api\ReceiveOrder\Services\ReceiveOrderPdfService;
use App\Api\Sales\Services\SalesService;
use Illuminate\Http\Request;

/**
 * 受注データコントローラー
 */
class ReceiveOrderController extends BaseController
{
  /** @var \App\Api\ReceiveOrder\Services\ReceiveOrderService */
  protected $service;

  /**
   * @param \App\Api\ReceiveOrder\Services\ReceiveOrderService $service
   */
  public function __construct(ReceiveOrderService $service)
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
   * @param int $id 受注ID
   */
  public function selected(int $id)
  {
    $data = $this->service->get($id);

    return $this->success($data);
  }

  /**
   * 選択（売上用）
   *
   * @param int $id 受注ID
   */
  public function selected_for_sales(int $id)
  {
    $s = new SalesService();
    $data = $s->get_by_receive_id($id);

    return $this->success($data);
  }

  /**
   * 選択（発注用）
   *
   * @param int $id 受注ID
   */
  public function selected_for_place(int $id)
  {
    $s = new PlaceOrderService();
    $data = $s->get_by_receive_id($id);

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
   * @param int $id 受注ID
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
  public function store(ReceiveOrderStoreRequest $request)
  {
    $id = $this->service->store($request->validated());

    return $this->success([
      'id' => $id,
    ]);
  }

  /**
   * 更新
   *
   * @param int $id 受注ID
   */
  public function update(ReceiveOrderUpdateRequest $request, int $id)
  {
    if ($this->service->hasSales($id)) {
      return $this->error("", [
        'has_sales' => '既に売上データが存在するため、データの編集は出来ません。',
      ]);
    }

    $this->service->update($id, $request->validated());

    return $this->success();
  }

  /**
   * バリデーション（削除）
   *
   * @param int $id 受注ID
   */
  public function validate_delete(int $id)
  {
    $check = $this->service->validate_delete($id);
    return $this->success([
      "check" => $check,
    ]);
  }

  /**
   * 削除
   *
   * @param int $id 受注ID
   */
  public function delete(int $id)
  {
    if ($this->service->hasSales($id)) {
      return $this->error("", [
        'has_sales' => '既に売上データが存在するため、データの編集は出来ません。',
      ]);
    }

    $this->service->delete($id);

    return $this->success();
  }

  /**
   * 明細（バリデーション）
   */
  public function detail(ReceiveOrderDetailRequest $request)
  {
    return $this->success();
  }

  /**
   * ご注文承り書印刷
   */
  public function output(ReceiveOrderOutputRequest $request)
  {
    $data = $this->service->getPdfData($request->validated());

    $pdf = new ReceiveOrderPdfService();
    $file_id = $pdf->createPdf($data);

    return $this->success([
      'file_id' => $file_id,
    ]);
  }
}