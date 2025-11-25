<?php

namespace App\Api\Customer\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\Customer\Requests\CustomerStoreRequest;
use App\Api\Customer\Requests\CustomerUpdateRequest;
use App\Api\Customer\Requests\CustomerSimpleStoreRequest;
use App\Api\Customer\Services\CustomerService;
use App\Api\Customer\Services\CustomerExcelService;
use Illuminate\Http\Request;

/**
 * 得意先マスタコントローラー
 */
class CustomerController extends BaseController
{
  /** @var \App\Api\Customer\Services\CustomerService */
  protected $service;

  /**
   * @param \App\Api\Customer\Services\CustomerService $service
   */
  public function __construct(CustomerService $service)
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
   * @param int $id 得意先ID
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
   * @param int $id 得意先ID
   */
  public function edit(int $id)
  {
    $data = $this->service->get($id);

    return $this->success($data);
  }

  /**
   * 登録
   */
  public function store(CustomerStoreRequest $request)
  {
    // バリデーション済みの値を取得
    $data = $request->validated();

    // 住所1／住所2との互換のために、prefectures / municipality / number を補正
    $data = $this->normalizeAddress($data, $request);

    $this->service->store($data);

    return $this->success();
  }

  /**
   * 更新
   *
   * @param int $id 得意先ID
   */
  public function update(CustomerUpdateRequest $request, int $id)
  {
    // バリデーション済みの値を取得
    $data = $request->validated();

    // 住所1／住所2との互換のために、prefectures / municipality / number を補正
    $data = $this->normalizeAddress($data, $request);

    $this->service->update($id, $data);

    return $this->success();
  }

  /**
   * 削除
   *
   * @param int $id 得意先ID
   */
  public function delete(int $id)
  {
    $this->service->delete($id);

    return $this->success();
  }

  /**
   * 簡易登録
   */
  public function simple_store(CustomerSimpleStoreRequest $request)
  {
    $id = $this->service->simpleStore($request->validated());

    return $this->success([
      'id' => $id,
    ]);
  }

  /**
   * エクセル出力
   */
  public function output_excel(Request $request)
  {
    $input = $request->all();
    $rows = $this->service->getExcelData($input);

    $excel = new CustomerExcelService();
    $file_id = $excel->createExcel($rows);
    return $this->success([
      'file_id' => $file_id,
    ]);
  }

  /**
   * 住所1／住所2と prefetcures / municipality / number の互換を取るための補正処理
   *
   * - すでに prefetcures / municipality / number が埋まっている場合はそれを優先
   * - 空の場合のみ、address1 / address2 から詰める
   * - prefectures はこの段階では空文字にしておき、後続の改善で都道府県の切り出しを行う想定
   *
   * @param array   $data     validated() 済みの配列
   * @param Request $request  生のリクエスト（address1/address2 用）
   * @return array
   */
  private function normalizeAddress(array $data, Request $request): array
  {
    // 生リクエストから address1 / address2 を取得（旧UIの互換用）
    $address1 = (string) $request->input('address1', '');
    $address2 = (string) $request->input('address2', '');

    // prefetcures / municipality / number が入力されていない場合のみ、address1/2 から補完する

    // municipality（市区町村・区・町名）
    if (empty($data['municipality']) && $address1 !== '') {
      // 旧システムでは address1 に「都道府県 + 市区町村」が入っていたが、
      // ここでは一旦「まとめて municipality に入れる」方針とする。
      $data['municipality'] = $address1;
    }

    // number（建物名・番地など）
    if (empty($data['number']) && $address2 !== '') {
      $data['number'] = $address2;
    }

    // prefectures（都道府県）は、当面は空文字で埋める
    // （NOT NULL 制約を避けるため。後で都道府県マスタから切り出す処理を追加予定）
    if (!array_key_exists('prefectures', $data) || $data['prefectures'] === null) {
      $data['prefectures'] = '';
    }

    // municipality / number も NULL のまま DB に流さないようにしておく
    if (!array_key_exists('municipality', $data) || $data['municipality'] === null) {
      $data['municipality'] = '';
    }
    if (!array_key_exists('number', $data) || $data['number'] === null) {
      $data['number'] = '';
    }

    return $data;
  }
}
