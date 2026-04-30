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
use Illuminate\Support\Facades\DB;

/**
 * 受注データコントローラー
 */
class ReceiveOrderController extends BaseController
{
  /** @var \App\Api\ReceiveOrder\Services\ReceiveOrderService */
  protected $service;

  public function __construct(ReceiveOrderService $service)
  {
    $this->service = $service;
  }

  public function dialog(Request $request)
  {
    $input = $request->all();
    $data = $this->service->dialog($input);

    return $this->success($data);
  }

  public function selected(int $id)
  {
    $data = $this->service->get($id);

    return $this->success($data);
  }

  public function selected_for_sales(int $id)
  {
    $s = new SalesService();
    $data = $s->get_by_receive_id($id);

    return $this->success($data);
  }

  public function selected_for_place(int $id)
  {
    $s = new PlaceOrderService();
    $data = $s->get_by_receive_id($id);

    return $this->success($data);
  }

  public function fetch(Request $request)
  {
    $input = $request->all();
    $data = $this->service->fetch($input);

    return $this->success($data);
  }

  public function edit($id = null)
  {
    if ($id) {
      $data = $this->service->get($id);
    } else {
      $data = $this->service->newData();
    }

    return $this->success($data);
  }

  public function store(ReceiveOrderStoreRequest $request)
  {
    $id = $this->service->store($request->validated());

    return $this->success([
      'id' => $id,
    ]);
  }

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

  public function validate_delete(int $id)
  {
    $check = $this->service->validate_delete($id);
    return $this->success([
      "check" => $check,
    ]);
  }

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

  public function detail(ReceiveOrderDetailRequest $request)
  {
    return $this->success();
  }

  /**
   * ご注文承り書印刷
   */
  public function output(ReceiveOrderOutputRequest $request)
  {
    $cond = $request->validated();
    $data = $this->service->getPdfData($cond);

    // getPdfData から戻る配列には id が入っている想定
    $orderId = $data['id'] ?? ($cond['id'] ?? null);

    if ($orderId) {
      // 親（値引・備考）
      $extra = DB::table('t_receive_orders')
        ->where('id', $orderId)
        ->first();

      if ($extra) {
        $data = array_merge($data, (array)$extra);
      }

      // ★PDF用 明細：t_receive_order_details を生で取り直す（discount_amount を必ず含める）
      $data['details'] = DB::table('t_receive_order_details')
        ->select([
          'id',
          'receive_order_id',
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
          'discount',
        ])
        ->where('receive_order_id', $orderId)
        ->whereIn('item_kind', [1, 2]) // セット子(3)は出さない（必要ならここを調整）
        ->orderBy('no')
        ->get()
        ->toArray();

      logger()->info('receive pdf details meta', [
        'receive_order_id' => $orderId,
        'db' => DB::connection()->getDatabaseName(),
        'first' => $data['details'][0] ?? null,
      ]);
    }

    $pdf = new ReceiveOrderPdfService();
    $file_id = $pdf->createPdf($data);

    return $this->success([
      'file_id' => $file_id,
    ]);
  }
}
