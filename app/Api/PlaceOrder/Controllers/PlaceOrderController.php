<?php

namespace App\Api\PlaceOrder\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\PlaceOrder\Requests\PlaceOrderStoreRequest;
use App\Api\PlaceOrder\Requests\PlaceOrderUpdateRequest;
use App\Api\PlaceOrder\Requests\PlaceOrderDetailRequest;
use App\Api\PlaceOrder\Requests\PlaceOrderSendingMailRequest;
use App\Api\PlaceOrder\Services\PlaceOrderService;
use Illuminate\Http\Request;

/**
 * 発注データコントローラー
 */
class PlaceOrderController extends BaseController
{
  /** @var \App\Api\PlaceOrder\Services\PlaceOrderService */
  protected $service;

  /**
   * @param \App\Api\PlaceOrder\Services\PlaceOrderService $service
   */
  public function __construct(PlaceOrderService $service)
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
   * @param int $id 発注ID
   */
  public function selected(int $id)
  {
    $data = $this->service->get($id);

    return $this->success($data);
  }

  /**
   * 選択（仕入用）
   *
   * @param int $id 発注ID
   */
  public function selected_for_purchase(int $id)
  {
    $data = $this->service->get($id, true);

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
   * @param int $id 発注ID
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
   * 詳細画面（受注ID）
   *
   * @param mixed $id 受注ID
   */
  public function edit_by_receive_id($id)
  {
    $data = $this->service->get_by_receive_id($id);

    return $this->success($data);
  }

  /**
   * 登録
   */
  public function store(PlaceOrderStoreRequest $request)
  {
    $id = $this->service->store($request->validated());
    $hasOrderMail = $this->service->hasOrderMail($request->validated());

    return $this->success([
      'hasOrderMail' => $hasOrderMail,
      'id' => $id,
    ]);
  }

  /**
   * 更新
   *
   * @param int $id 発注ID
   */
  public function update(PlaceOrderUpdateRequest $request, int $id)
  {
    $this->service->update($id, $request->validated());
    $hasOrderMail = $this->service->hasOrderMail($request->validated(), $id);

    return $this->success([
      'hasOrderMail' => $hasOrderMail,
    ]);
  }

  /**
   * 削除
   *
   * @param int $id 発注ID
   */
  public function delete(int $id)
  {
    $this->service->delete($id);

    return $this->success();
  }

  /**
   * 明細（バリデーション）
   */
  public function detail(PlaceOrderDetailRequest $request)
  {
    return $this->success();
  }

  /**
   * メール取得
   */
  public function get_mail(PlaceOrderSendingMailRequest $request)
  {
    $mail = $this->service->getMail($request->validated());
    return $this->success([
      'mail' => $mail
    ]);
  }

  /**
   * メール送信
   */
  public function sending_mail(PlaceOrderSendingMailRequest $request)
  {
    $ret = $this->service->sendingMail($request->validated());
    if ($ret) {
      return $this->success();
    } else {
      return $this->error();
    }
  }
}