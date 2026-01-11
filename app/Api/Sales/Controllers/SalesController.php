<?php

namespace App\Api\Sales\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\Sales\Requests\SalesStoreRequest;
use App\Api\Sales\Requests\SalesUpdateRequest;
use App\Api\Sales\Requests\SalesDetailRequest;
use App\Api\Sales\Services\SalesService;
use App\Api\Sales\Services\SalesPdfService;
use App\Api\Sales\Services\SalesExcelService;
use Illuminate\Http\Request;

/**
 * 売上データコントローラー
 *
 * 役割（Controllerの責務）:
 * - HTTPリクエストを受け取り、入力を配列化/バリデーションし、Serviceへ委譲する
 * - Serviceの返却値を API の統一レスポンス形式（success/error）に変換して返す
 * - PDF/Excel 出力の入口を提供し、ファイル生成は専用 Service に任せる
 *
 * 注意:
 * - 実際のビジネスロジック（DB更新、金額/税計算、整形等）は SalesService 側で行う
 * - ここでは「入力→Service→結果返却」という中継に徹するのが設計意図
 */
class SalesController extends BaseController
{
  /**
   * 売上ドメインの中核サービス
   * - newData/get/fetch/store/update/delete/PDF・Excel用データ組み立て等を担当
   *
   * @var \App\Api\Sales\Services\SalesService
   */
  protected $service;

  /**
   * DI により SalesService を注入
   * （LaravelのService Containerが解決）
   */
  public function __construct(SalesService $service)
  {
    $this->service = $service;
  }

  /**
   * 売上画面の各種ダイアログ用データ取得
   *
   * 想定:
   * - フロント側のモーダル表示に必要な候補一覧や初期値を返す用途
   * - 具体的な内容は SalesService::dialog() に依存
   */
  public function dialog(Request $request)
  {
    $input = $request->all();
    $data = $this->service->dialog($input);

    return $this->success($data);
  }

  /**
   * 売上一覧取得（検索条件付き）
   *
   * 想定:
   * - 検索フォーム（期間、顧客、伝票番号等）からの条件を受け取り一覧を返す
   * - ページング等は Service 側が責務（実装依存）
   */
  public function fetch(Request $request)
  {
    $input = $request->all();
    $data = $this->service->fetch($input);

    return $this->success($data);
  }

  /**
   * 売上編集画面の初期データ取得
   *
   * - $id がある: 既存売上の詳細データを取得して編集フォームに流す
   * - $id がない: 新規作成用の初期値（税率、端数処理、マスタ初期値など）を返す
   *
   * 背景（あなたの現状課題にも関連）:
   * - 新規時に newData() の返却項目（sales_tax_rate 等）が欠けると、
   *   フロントの明細モーダルで税計算が 0 になるなどの問題が起きやすい
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
   * 受注ID（receive_order_id）から売上データを引く
   *
   * 想定:
   * - 「受注から売上生成」や「受注起点で売上を参照」する導線向け
   * - Service 側で受注→売上の紐付け（または検索）を行う
   */
  public function edit_by_receive_id($id)
  {
    $data = $this->service->get_by_receive_id($id);

    return $this->success($data);
  }

  /**
   * 売上登録（新規作成）
   *
   * 流れ:
   * 1) SalesStoreRequest によるバリデーション（$request->validated()）
   * 2) SalesService::store() に委譲
   * 3) service返却が success=false の場合は error レスポンス
   * 4) 成功時は作成された売上IDのみ返す
   *
   * 備考:
   * - ここにある \Log::warning は原因調査用（Controller到達/validate通過/Service返却の観測）
   * - 本番でノイズになる場合はログレベルや出力条件を調整するのが望ましい
   */
  public function store(SalesStoreRequest $request)
  {
    try {
      // FormRequest のバリデーション結果のみを使用する（未定義キー混入防止）
      $validated = $request->validated();
      $ret = $this->service->store($validated);

      // Service の統一返却形式に従い、失敗時は errors を返す
      if (!($ret['success'] ?? false)) {
        return $this->error('', $ret['errors'] ?? ['system' => '登録に失敗しました。']);
      }

      // 成功時は作成IDを返す（フロントはこのIDで edit/get へ遷移する想定）
      return $this->success([
        'id' => $ret['id'],
      ]);

    } catch (\Throwable $e) {
      // ここは「500で落ちた」ことを返す（フロント側確認用）
      return response()->json([
        'success' => false,
        'message' => 'STORE_EXCEPTION',
      ], 500);
    }
  }

  /**
   * 編集前チェック（更新の事前バリデーション/整合性チェック）
   *
   * 想定:
   * - フロントが「更新してよいか？」を事前に確認する用途
   * - 例: 請求済みロック、締め処理済み、在庫引当済みなど
   *
   * 返却:
   * - Serviceの check 結果をそのまま返す（構造は Service 実装に依存）
   */
  public function validate_edit(SalesUpdateRequest $request, int $id)
  {
    $validated = $request->validated();
    $check = $this->service->validate_edit($id, $validated);
    return $this->success([
      "check" => $check,
    ]);
  }

  /**
   * 売上更新
   *
   * 仕様（Controller側の制御）:
   * - 請求データが存在する（hasInvoice=true）場合は更新不可としてエラー返却
   * - それ以外は SalesService::update() に委譲
   */
  public function update(SalesUpdateRequest $request, int $id)
  {
    // 請求データがある売上は編集不可（整合性維持・会計確定の想定）
    if ($this->service->hasInvoice($id)) {
      return $this->error("", [
        'has_invoice' => '既に請求データが存在するため、データの編集は出来ません。',
      ]);
    }

    $validated = $request->validated();
    $ret = $this->service->update($id, $validated);

    if (!$ret["success"]) {
      return $this->error("", $ret["errors"]);
    }

    return $this->success();
  }

  /**
   * 売上削除
   *
   * 仕様:
   * - 請求データが存在する場合は削除不可
   * - 実際の削除方式（論理削除/物理削除）は Service 実装に依存
   */
  public function delete(int $id)
  {
    if ($this->service->hasInvoice($id)) {
      return $this->error("", [
        'has_invoice' => '既に請求データが存在するため、データの編集は出来ません。',
      ]);
    }

    $this->service->delete($id);

    return $this->success();
  }

  /**
   * 詳細表示時のバリデーション用エンドポイント（現状はsuccessのみ返す）
   *
   * 想定:
   * - SalesDetailRequest のバリデーションを通すこと自体に意味がある設計
   *   （例: 権限チェック・パラメータ形式チェック）
   * - 実処理は別エンドポイント（edit/get 等）で行っている可能性
   *
   * ※現状ロジックが空なら、将来的に用途がない場合はルーティング含め整理候補
   */
  public function detail(SalesDetailRequest $request)
  {
    return $this->success();
  }

  /**
   * 納品書PDF 出力
   *
   * 流れ:
   * 1) SalesService::getPdfData() でPDF描画に必要なデータを組み立て
   * 2) SalesPdfService::createPdf() でPDF生成
   * 3) 生成された file_id を返す（フロントは file_id でダウンロードする想定）
   */
  public function output_delivery(SalesUpdateRequest $request)
  {
    $validated = $request->validated();
    $data = $this->service->getPdfData($validated);

    $pdf = new SalesPdfService();
    $file_id = $pdf->createPdf($data, "納品書");

    return $this->success([
      'file_id' => $file_id,
    ]);
  }

  /**
   * 請求書PDF 出力
   *
   * 納品書と同様に、doc_type（表示種別）だけを "請求書" に変えて生成する。
   */
  public function output_invoice(SalesUpdateRequest $request)
  {
    $validated = $request->validated();
    $data = $this->service->getPdfData($validated);

    $pdf = new SalesPdfService();
    $file_id = $pdf->createPdf($data, "請求書");

    return $this->success([
      'file_id' => $file_id,
    ]);
  }

  /**
   * Excel 出力
   *
   * 流れ:
   * 1) SalesService::getExcelData() で出力行データを構築
   * 2) SalesExcelService::createExcel() でExcel生成
   * 3) file_id を返す
   *
   * 注意:
   * - PDFと異なり Request が汎用 Request のままなので、
   *   入力条件のバリデーションが必要なら FormRequest 化を検討余地あり
   */
  public function output_excel(Request $request)
  {
    $input = $request->all();

    $rows = $this->service->getExcelData($input);

    $excel = new SalesExcelService();
    $file_id = $excel->createExcel($rows);
    return $this->success([
      'file_id' => $file_id,
    ]);
  }
}

