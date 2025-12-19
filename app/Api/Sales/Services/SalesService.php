<?php

namespace App\Api\Sales\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;
use App\Base\Models\Sales;
use App\Base\Models\DeliveryAddress;

class SalesService
{
    
    public function getEditData($id): ?array
    {
        $sales = Sales::with(['details.item', 'customer', 'personnel', 'payment'])->find($id);
        if (!$sales) {
            return null;
        }

        $detailsAmount = (int) collect($sales->details)->sum('amount');

        // 配送先
        $deliveryData = null;
        if ($sales->delivery_id) {
            $delivery = DeliveryAddress::find($sales->delivery_id);
            if ($delivery) {
                $deliveryData = [
                    'recipient_name' => $delivery->recipient_name ?? '',
                    'zip_code'       => $delivery->zip_code ?? '',
                    'prefectures'    => $delivery->prefectures ?? '',
                    'municipality'   => $delivery->municipality ?? '',
                    'number'         => $delivery->number ?? '',
                    'tel'            => $delivery->tel ?? '',
                ];
            }
        }

        // 掛率（得意先レベル）
        $customerRate = optional($sales->customer)->rate;

        // 明細（配列化）
        $details = collect($sales->details)->map(function ($d) use ($customerRate) {
            // 明細の rate を最優先 → 無ければ得意先 → それも無ければ 100
            $detailRate = $d->rate ?? $customerRate ?? 100;

            return [
                'id'               => $d->id,
                'item_id'          => $d->item_id,
                'item_kind'        => $d->item_kind,
                'item_number'      => optional($d->item)->code,
                'item_name'        => optional($d->item)->name,
                'item_name_jp'     => optional($d->item)->name_note,
                'sales_unit_price' => $d->sales_unit_price,
                'rate'             => $detailRate,
                'unit_price'       => $d->unit_price,
                'quantity'         => $d->quantity,
                'amount'           => $d->amount,
                'sales_tax_rate'   => $d->sales_tax_rate ?? null,
                'fraction'         => $d->fraction ?? null,
                'no'               => $d->no ?? null,
            ];
        })->values()->all();

        // 支払方法 → corporate_class（paymentが無い/列が無い場合のフォールバックあり）
        $corporateClass = null;
        if ($sales->payment && isset($sales->payment->method_code)) {
            switch ($sales->payment->method_code) {
                case '1': $corporateClass = 1; break; // 現金
                case '2': $corporateClass = 2; break; // 掛売
                case '3': $corporateClass = 3; break; // 宅配代引
                case '4': $corporateClass = 4; break; // 銀行振込
                case '5': $corporateClass = 5; break; // クレジットカード
            }
        } elseif (Schema::hasColumn($sales->getTable(), 'corporate_class')) {
            $corporateClass = $sales->corporate_class !== null ? (int)$sales->corporate_class : null;
        }

        // send フラグ（どちらの列でも対応）
        $sendFlag = (bool) ($sales->send_flg ?? $sales->is_send ?? 0);

        // 配送先がある場合は配送先を優先してフラット項目に反映
        $flatName     = $deliveryData['recipient_name'] ?? ($sales->name ?? null);
        $flatZip      = $deliveryData['zip_code']       ?? ($sales->zip_code ?? null);
        $flatAddress1 = isset($deliveryData)
            ? (($deliveryData['prefectures'] ?? '') . ($deliveryData['municipality'] ?? ''))
            : ($sales->address1 ?? null);
        $flatAddress2 = $deliveryData['number'] ?? ($sales->address2 ?? null);
        $flatTel      = $deliveryData['tel']    ?? ($sales->tel ?? null);

        return [
            'id'                => (int) $sales->id,
            'sales_at'          => $sales->sales_at,
            'delivery_date'     => $sales->delivery_date ?? null,
            'customer_id'       => $sales->customer_id,
            'customer_name'     => optional($sales->customer)->name,
            'send_flg'          => $sendFlag,
            'name'              => $flatName,
            'zip_code'          => $flatZip,
            'address1'          => $flatAddress1,
            'address2'          => $flatAddress2,
            'tel'               => $flatTel,
            'fax'               => $sales->fax ?? null,
            'corporate_class'   => $corporateClass,
            'user_id'           => $sales->personnel_id ?? null,
            'user_name'         => optional($sales->personnel)->name,
            'shipping_amount'   => $sales->shipping_amount ?? 0,
            'fee'               => $sales->fee ?? 0,
            'discount'          => $sales->discount ?? 0,
            'total_amount'      => (int) ($sales->total_amount ?? 0),
            'order_no'          => $sales->order_no ?? null,
            'remarks'           => $sales->remarks ?? null,
            'rate'              => $customerRate ?? 100, // ヘッダ用（得意先 or 100）
            'sales_tax_rate'    => $sales->sales_tax_rate ?? null,
            'fraction'          => $sales->fraction ?? 1,
            'details'           => $details,
            'details_amount'    => $detailsAmount,
            'barcode'           => null,
            'has_invoice'       => (bool) ($sales->has_invoice ?? 0),
            'delivery'          => $deliveryData,
            'square_payment_id' => $sales->square_payment_id ?? null,
            'square_status'     => $sales->square_status ?? null,
        ];
    }

    /**
     * 新規の初期形
     */
    public function getInitialData(): Sales
    {
        return new Sales();
    }

    /* =========================================================================
     |  入力検証・正規化
     ========================================================================= */

    /**
     * @return array [ok(bool), normalized(array), errors(array)]
     */
    public function validateInput(array $input, bool $isUpdate = false): array
    {
        [$norm, $errs] = $this->normalize($input);

        // 必須
        if (empty($norm['sales_at']))           $errs['sales_at']        = '売上日を入力してください。';
        if (empty($norm['tel']))                $errs['tel']             = 'TELを入力してください。';
        if (!isset($norm['corporate_class']))   $errs['corporate_class'] = '支払方法（法人区分）を選択してください。';

        // 発送ありの場合の必須
        if (!empty($norm['send_flg'])) {
            if (empty($norm['name']))      $errs['name']      = '届け先名を入力してください。';
            if (empty($norm['zip_code']))  $errs['zip_code']  = '郵便番号を入力してください。';
            if (empty($norm['address1']))  $errs['address1']  = '住所1を入力してください。';
        }

        // 明細
        if (empty($norm['details']) || !is_array($norm['details'])) {
            $errs['details'] = '明細を1件以上追加してください。';
        } else {
            $qErr = false;
            foreach ($norm['details'] as $i => $d) {
                if (!isset($d['quantity']) || (int)$d['quantity'] <= 0) {
                    $qErr = true;
                    $errs["quantity_".($d['id'] ?? $d['no'] ?? $i)] = '数量が0以下です。';
                }
            }
            if ($qErr && !isset($errs['quantity'])) {
                $errs['quantity'] = '数量が0以下の明細があります。';
            }
        }

        return [empty($errs), $norm, $errs];
    }

    /**
     * 画面→DB保存用に正規化
     */
    private function normalize(array $in): array
    {
        $errors = [];

        $num = function ($v, $scale = 0) {
            if ($v === '' || $v === null) return 0;
            $v = is_string($v) ? str_replace([','], '', $v) : $v;
            if (!is_numeric($v)) return 0;
            return $scale > 0 ? round((float)$v, $scale) : (int)round((float)$v, 0);
        };
        $str  = fn($v) => is_null($v) ? null : (string)$v;
        $bool = fn($v) => (bool)$v;

        $fmtDate = function ($v) {
            if (!$v) return null;
            return str_replace('/', '-', $v);
        };

        // ヘッダ部
        $norm = [
            'sales_at'        => $fmtDate($in['sales_at'] ?? null),
            'delivery_date'   => $fmtDate($in['delivery_date'] ?? null),
            'customer_id'     => isset($in['customer_id']) ? (int)$in['customer_id'] : null,
            'send_flg'        => $bool($in['send_flg'] ?? false),
            'name'            => $str($in['name'] ?? null),
            'zip_code'        => $str($in['zip_code'] ?? null),
            'address1'        => $str($in['address1'] ?? null),
            'address2'        => $str($in['address2'] ?? null),
            'tel'             => $str($in['tel'] ?? null),
            'fax'             => $str($in['fax'] ?? null),
            'corporate_class' => isset($in['corporate_class']) ? (int)$in['corporate_class'] : null,
            'user_id'         => isset($in['user_id']) ? (int)$in['user_id'] : null,
            'shipping_amount' => $num($in['shipping_amount'] ?? 0, 2),
            'fee'             => $num($in['fee'] ?? 0, 2),
            'discount'        => $num($in['discount'] ?? 0, 2),
            'total_amount'    => $num($in['total_amount'] ?? 0, 0),
            'order_no'        => $str($in['order_no'] ?? null),
            'remarks'         => $str($in['remarks'] ?? null),
            'rate'            => isset($in['rate']) ? (int)$in['rate'] : 100,
            'sales_tax_rate'  => isset($in['sales_tax_rate']) ? (int)$in['sales_tax_rate'] : null,
            'fraction'        => isset($in['fraction']) ? (int)$in['fraction'] : 1,
            'receive_order_id'=> isset($in['receive_order_id']) ? (int)$in['receive_order_id'] : null,
            'has_invoice'     => $bool($in['has_invoice'] ?? false),
        ];

        // 明細
        $details = [];
        foreach (($in['details'] ?? []) as $idx => $d) {
            $details[] = [
                'no'               => isset($d['no']) ? (int)$d['no'] : ($idx + 1),
                'item_kind'        => isset($d['item_kind']) ? (int)$d['item_kind'] : null,
                'item_id'          => isset($d['item_id']) ? (int)$d['item_id'] : null,
                'sales_unit_price' => $num($d['sales_unit_price'] ?? 0, 2),

                //  明細から rate が送られてきたときだけ整数キャスト。無ければ null
                'rate'             => (
                    array_key_exists('rate', $d)
                    && $d['rate'] !== null
                    && $d['rate'] !== ''
                )
                    ? (int)$d['rate']
                    : null,

                'unit_price'       => $num($d['unit_price'] ?? 0, 2),
                'quantity'         => isset($d['quantity']) ? (int)$d['quantity'] : 0,
                'amount'           => $num($d['amount'] ?? 0, 0),
                'sales_tax_rate'   => isset($d['sales_tax_rate']) ? (int)$d['sales_tax_rate'] : null,
                'fraction'         => isset($d['fraction']) ? (int)$d['fraction'] : 1,
            ];
        }
        $norm['details'] = $details;

        // 合計再計算
        $detailsSum = array_sum(array_map(fn($d) => (int)$d['amount'], $details));
        $norm['details_amount'] = $detailsSum;
        $norm['total_amount']   = (int) round(
            $detailsSum + ($norm['shipping_amount'] ?? 0) + ($norm['fee'] ?? 0) - ($norm['discount'] ?? 0),
            0
        );

        return [$norm, $errors];
    }

    /* =========================================================================
     |  支払方法ID 解決ヘルパ
     ========================================================================= */

    private function resolvePaymentId(?int $corporateClass): ?int
    {
        $code = $corporateClass ? (string)$corporateClass : null;
        $candidates = ['m_payment_methods', 'm_payments', 'payments'];

        foreach ($candidates as $table) {
            if (!Schema::hasTable($table)) continue;
            $hasMethod = Schema::hasColumn($table, 'method_code');
            $query = DB::table($table);
            if ($code && $hasMethod) {
                $id = $query->where('method_code', $code)->value('id');
                if ($id) return (int)$id;
            }
            $fallback = DB::table($table)->orderBy('id')->value('id');
            if ($fallback) return (int)$fallback;
        }

        return null;
    }

    /**
     * 顧客TEL取得ヘルパ
     * - t_customers / m_customers / customers のいずれかから TEL 系カラムを探す
     */
    private function getCustomerTel(?int $customerId): ?string
    {
        if (!$customerId) {
            return null;
        }

        $tables = ['t_customers', 'm_customers', 'customers'];
        $telColumns = ['tel', 'phone', 'phone_number'];

        foreach ($tables as $tbl) {
            if (!Schema::hasTable($tbl)) {
                continue;
            }

            $row = DB::table($tbl)->where('id', $customerId)->first();
            if (!$row) {
                continue;
            }

            foreach ($telColumns as $col) {
                if (Schema::hasColumn($tbl, $col) && !empty($row->$col)) {
                    return (string) $row->$col;
                }
            }
        }

        return null;
    }

    /* =========================================================================
     |  登録・更新・削除
     ========================================================================= */

    /**
     * 登録
     * @return int 生成した Sales ID
     * @throws Throwable
     */
    public function store(array $norm): array
    {
        try {
            $id = $this->storeInternal($norm);

            return [
                'success' => true,
                'id'      => $id,
            ];
        } catch (\Throwable $e) { //  グローバル名前空間の Throwable を指定

            // 失敗内容をログに出す（ローカル調査用）
            \Log::error('[SalesService][store] failed', [
                'message' => $e->getMessage(),
                'code'    => $e->getCode(),
                'file'    => $e->getFile(),
                'line'    => $e->getLine(),
            ]);

            report($e); // いつもの Laravel の例外レポート

            return [
                'success' => false,
                'errors'  => ['system' => '登録に失敗しました。'],
            ];
        }
    }

    /**
     * 更新（元コントローラ互換：配列で success を返す）
     * @return array{success:bool, errors?:array}
     */
    public function update(int $id, array $norm): array
    {
        try {
            $this->updateInternal($id, $norm);
            return ['success' => true];
        } catch (Throwable $e) {
            report($e);
            return [
                'success' => false,
                'errors'  => ['system' => '更新に失敗しました。'],
            ];
        }
    }

    /**
     * 削除
     */
    public function delete(int $id): void
    {
        DB::transaction(function () use ($id) {
            /** @var Sales $sales */
            $sales = Sales::with(['details'])->findOrFail($id);
            $sales->details()->delete();
            $sales->delete();
        });
    }

    // =========================================================================
    //  ここから下：元コントローラー互換の“薄いアダプタ”を追加 
    // =========================================================================

    /**
     * 元コントローラー互換: 売上IDから編集用データを取得
     * 既存の getEditData($id) をラップ
     */
    public function get($id): array
    {
        $data = $this->getEditData($id);
        if (!$data) return [];
        // 最低限の補完（nullプロパティでUIが落ちないように）
        $data['details']     = $data['details']     ?? [];
        $data['has_invoice'] = $data['has_invoice'] ?? false;
        $data['sales_at']    = $data['sales_at']    ?? date('Y/m/d');
        return $data;
    }

    /**
     * 元コントローラー互換: 新規用データ
     * 既存の getInitialData() をラップ
     */
    public function newData(): array
    {
        \Log::info('[SalesService][newData] start');

        $d = $this->getInitialData();
        $data = is_object($d) && method_exists($d, 'toArray')
            ? $d->toArray()
            : (array)$d;

        // 画面が壊れないための最低限のデフォルト
        $data += [
            'details'     => [],
            'has_invoice' => false,
            'sales_at'    => date('Y/m/d'),
        ];

        //  デフォルト担当者（管理者）を取得
        $defaultPersonnel = $this->getDefaultPersonnel();

        if ($defaultPersonnel) {
            // まだ何も入っていない場合だけ管理者で補完
            if (empty($data['user_id'])) {
                $data['user_id'] = $defaultPersonnel['id'];
            }
            if (empty($data['user_name'])) {
                $data['user_name'] = $defaultPersonnel['name'];
            }

            \Log::info('[SalesService][newData] set default personnel', [
                'user_id'   => $data['user_id'],
                'user_name' => $data['user_name'],
            ]);
        } else {
            \Log::warning('[SalesService][newData] default personnel not found');
        }

        \Log::info('[SalesService][newData] end', [
            'sales_at' => $data['sales_at'],
            'user_id'  => $data['user_id'] ?? null,
        ]);

        return $data;
    }
    
    /**
     * 元コントローラー互換: 受注IDから売上初期データを生成
     * 過去のコントローラー実装（DB直読み）をこのサービスに移植
     */
    public function get_by_receive_id($id): array
    {
        $r = DB::table('t_receive_orders')->where('id', $id)->first();
        if (!$r) {
            return ['success' => false, 'errors' => ['receive_order_id' => '受注が見つかりません']];
        }

        $details = DB::table('t_receive_order_details')
            ->where('receive_order_id', $id)
            ->orderBy('no')
            ->get()
            ->map(function ($d) use ($r) {
                // 受注明細の rate → 受注ヘッダの rate → 100 の順で初期値を決定
                $headerRate = $r->rate ?? 100;

                return [
                    'id'               => $d->id,
                    'no'               => $d->no,
                    'item_kind'        => $d->item_kind,
                    'item_id'          => $d->item_id,
                    'item_number'      => $d->item_number,
                    'item_name'        => $d->item_name,
                    'item_name_jp'     => $d->item_name_jp,
                    'sales_unit_price' => $d->sales_unit_price,
                    'rate'             => $d->rate ?? $headerRate,
                    'unit_price'       => $d->unit_price,
                    'quantity'         => $d->quantity,
                    'amount'           => $d->amount,
                    'sales_tax_rate'   => $d->sales_tax_rate,
                    'sales_tax'        => $d->sales_tax,
                    'fraction'         => $d->fraction ?? 3,
                ];
            })
            ->values()
            ->all();

        $userId   = $r->user_id ?? null;
        $userName = null;

        // 受注に担当者が入っていなければ、デフォルト担当者（管理者）を使う
        if (!$userId) {
            $defaultPersonnel = $this->getDefaultPersonnel();
            if ($defaultPersonnel) {
                $userId   = $defaultPersonnel['id'];
                $userName = $defaultPersonnel['name'];
            }
        }

        return [
            'id'               => null,
            'sales_at'         => date('Y/m/d'),
            'delivery_date'    => $r->delivery_date ?? null,
            'customer_id'      => $r->customer_id ?? null,
            'customer_name'    => $r->customer_name ?? null,
            'send_flg'         => (bool)($r->send_flg ?? 0),
            'name'             => $r->name ?? null,
            'zip_code'         => $r->zip_code ?? null,
            'address1'         => $r->address1 ?? null,
            'address2'         => $r->address2 ?? null,
            'tel'              => $r->tel ?? null,
            'fax'              => $r->fax ?? null,
            'corporate_class'  => (int)($r->corporate_class ?? 1),
            'user_id'          => $userId,
            'user_name'        => $userName,
            'shipping_amount'  => $r->shipping_amount ?? 0,
            'fee'              => $r->fee ?? 0,
            'discount'         => $r->discount ?? 0,
            'total_amount'     => $r->total_amount ?? 0,
            'order_no'         => $r->order_no ?? null,
            'remarks'          => $r->remarks ?? null,
            'rate'             => (int)($r->rate ?? 100),
            'sales_tax_rate'   => null,
            'fraction'         => (int)($r->fraction ?? 3),
            'details'          => $details,
            'has_invoice'      => false,
            'delivery'         => null,
            'receive_order_id' => (int)$id,
        ];
    }

    /**
     * 元コントローラー互換: PDF用データ作成
     * - 入力: validated 配列（id もしくは data を期待）
     * - 出力: SalesPdfService::createPdf() に渡す配列
     */
    public function getPdfData(array $input)
    {
        // 旧同様、まずフロントから data が来ていればそれを使う
        $data = $input['data'] ?? null;

        // data が無ければ id から構築
        if (!$data && !empty($input['id'])) {
            $id = (int)$input['id'];

            // ヘッダ：t_sales + 担当者名（m_personnels）
            $s = DB::table('t_sales as s')
                ->leftJoin('m_personnels as p', 'p.id', '=', 's.personnel_id')
                ->selectRaw('s.*, p.name as user_name')
                ->where('s.id', $id)
                ->first();

            if (!$s) {
                return ['success' => false, 'errors' => ['system' => '売上が見つかりません']];
            }

            // 明細は t_sale_details を単独取得（no順）
            $rows = DB::table('t_sale_details as d')
                ->select(
                    'd.id', 'd.item_id', 'd.item_kind', 'd.no',
                    'd.unit_price', 'd.quantity', 'd.amount',
                    'd.sales_tax', 'd.sales_tax_rate'
                )
                ->where('d.sale_id', $id)
                ->whereIn('d.item_kind', [1, 2]) // 親のみ
                ->orderBy('d.no')
                ->get();

            // item 情報のマップ
            $itemIds = $rows->pluck('item_id')->filter()->unique()->values();
            $itemMap = $itemIds->isEmpty()
                ? collect()
                : DB::table('m_items')
                    ->whereIn('id', $itemIds)
                    ->selectRaw('id, item_number, name, COALESCE(name_note, name) as item_name_jp')
                    ->get()
                    ->keyBy('id');

            // PDFが期待する形へ（noでユニーク化）
            $details = $rows->map(function ($d) use ($itemMap) {
                $it = $itemMap->get($d->item_id);
                return [
                    'no'             => (int)($d->no ?? 0),
                    'item_number'    => $it->item_number ?? '',
                    'item_name_jp'   => $it->item_name_jp ?? ($it->name ?? ''),
                    'quantity'       => (float)($d->quantity ?? 0),
                    'item_kind'      => (int)  ($d->item_kind ?? 1),
                    'unit_price'     => (float)($d->unit_price ?? 0),
                    'amount'         => (float)($d->amount ?? 0),
                    'sales_tax'      => (float)($d->sales_tax ?? 0),
                    'sales_tax_rate' => (int)  ($d->sales_tax_rate ?? 10),
                    'rate'           => 100,
                    'fraction'       => 3,
                ];
            })
            ->unique('no')
            ->sortBy('no')
            ->values()
            ->all();

            // ▼ 自社情報を m_configs から取得（最新版1件）
            $config = $this->loadCompanyConfig();
            // 税率は m_configs.sales_tax_rate を優先
            $salesTaxRate = (float)($config['sales_tax_rate'] ?? 10);

            // 売上日: timestamp → Y/m/d
            $salesDate = $s->sales_at ? \Carbon\Carbon::parse($s->sales_at)->format('Y/m/d') : null;

            // 旧キーに合わせて構築（宛先は ship_to_* を採用）
            $data = [
                'id'              => (int)$s->id,
                'user_name'       => $s->user_name ?? '',
                'sales_date'      => $salesDate,

                'zip_code'        => $s->ship_to_zip_code ?? '',
                'name'            => $s->ship_to_name ?? '',
                'tel'             => $s->ship_to_tel ?? '',
                'fax'             => '',

                'corporate_class' => 1, // 必要なら m_payments に応じて変換
                'order_no'        => $s->order_no ?? '',
                'user_id'         => (string)($s->personnel_id ?? ''),

                'shipping_amount' => (float)($s->shipping_amount ?? 0),
                'fee'             => (float)($s->fee ?? 0),
                'discount'        => (float)($s->discount ?? 0),
                'total_amount'    => (float)($s->total_amount ?? 0),
                'sales_tax_rate'  => $salesTaxRate,
                'fraction'        => 3,

                'details'         => $details,

                // 住所2段（旧 address1/address2）
                'address1'        => $s->ship_to_address1 ?? '',
                'address2'        => $s->ship_to_address2 ?? '',

                // ▼ PDF が参照する会社情報キーへ詰め替え
                'config_data'     => [
                    'company_name'      => $this->cfg($config, ['company_name'], 'ツアラテックジャパン'),
                    'zip_code'          => $this->cfg($config, ['zip_code']),
                    'address1'          => $this->cfg($config, ['address1']),
                    'address2'          => $this->cfg($config, ['address2']),
                    'tel'               => $this->cfg($config, ['tel']),
                    'fax'               => $this->cfg($config, ['fax']),
                    'bank_name1'        => $this->cfg($config, ['bank_name1']),
                    'branch_name1'      => $this->cfg($config, ['branch_name1']),
                    'account_type1'     => $this->cfg($config, ['account_type1']),
                    'account_number1'   => $this->cfg($config, ['account_number1']),
                    'bank_name2'        => $this->cfg($config, ['bank_name2']),
                    'branch_name2'      => $this->cfg($config, ['branch_name2']),
                    'account_type2'     => $this->cfg($config, ['account_type2']),
                    'account_number2'   => $this->cfg($config, ['account_number2']),
                ],
                // 口座の選択に使う既存互換データ
                'customer_data'   => [
                    'bank_class'       => 1, // 既定値（顧客テーブル未結線のため）
                ],
            ];

            // ローカルデバッグ
            if (app()->environment('local')) {
                \Log::info('[PDF] sale_id='.$id.' details_count='.count($details));
            }
        }

        if (!$data) {
            return ['success' => false, 'errors' => ['system' => '出力データがありません']];
        }

        return $data;
    }

    private function loadCompanyConfig(): array
    {
        $row = DB::table('m_configs')
            ->orderByDesc('id')
            ->first();

        if (!$row) {
            return [];
        }

        return [
            'company_name'     => $row->company_name ?? '',
            'zip_code'         => $row->zip_code ?? '',
            'address1'         => $row->address1 ?? '',
            'address2'         => $row->address2 ?? '',
            'tel'              => $row->tel ?? '',
            'fax'              => $row->fax ?? '',
            // 口座1
            'bank_name1'       => $row->bank_name1 ?? '',
            'branch_name1'     => $row->branch_name1 ?? '',
            'account_type1'    => $row->account_type1 ?? '',
            'account_number1'  => $row->account_number1 ?? '',
            // 口座2
            'bank_name2'       => $row->bank_name2 ?? '',
            'branch_name2'     => $row->branch_name2 ?? '',
            'account_type2'    => $row->account_type2 ?? '',
            'account_number2'  => $row->account_number2 ?? '',
            // 税率（PDF合計計算で使用可能）
            'sales_tax_rate'   => $row->sales_tax_rate ?? null,
        ];
    }

    private function getDefaultPersonnel(): ?array
    {
        if (!Schema::hasTable('m_personnels')) {
            return null;
        }

        $query = DB::table('m_personnels');

        // login_id カラムがある場合は admin を優先
        if (Schema::hasColumn('m_personnels', 'login_id')) {
            $row = $query->where('login_id', 'admin')->first();
        } else {
            $row = $query->orderBy('id')->first();
        }

        if (!$row) {
            return null;
        }

        return [
            'id'   => (int) $row->id,
            'name' => $row->name ?? null,
        ];
    }

    /**
     * 元コントローラー互換: 更新用バリデーションだけを行い、真偽を返す
     */
    public function validate_edit(int $id, array $validated): bool
    {
        [$ok] = $this->validateInput($validated, true);
        return (bool)$ok;
    }

    /**
     * 元コントローラー互換: 請求データの有無判定
     * - has_invoice カラム or 請求テーブル存在チェック
     */
    public function hasInvoice(int $id): bool
    {
        // 売上がなければ false
        $sales = Sales::find($id);
        if (!$sales) {
            return false;
        }

        // 1. t_sales に has_invoice カラムがある場合はそれを信頼
        if (Schema::hasColumn($sales->getTable(), 'has_invoice')) {
            return (bool) $sales->has_invoice;
        }

        // 2. 旧版の仕様どおりリンクテーブル t_link_sales_invoice を参照
        if (Schema::hasTable('t_link_sales_invoice')) {
            return DB::table('t_link_sales_invoice')
                ->where('sales_id', $id)
                ->count() > 0;
        }

        // ここまで来たら「請求管理の仕組み自体が未導入」という扱いで false
        return false;
    }

    /**
     * 実処理：登録（例外を上位に投げる）
     */
    private function storeInternal(array $norm): int
    {
        return DB::transaction(function () use ($norm) {

            // ログ：受け取ったキーとヘッダ情報
            \Log::info('[SalesService][storeInternal] start', [
                'keys'              => array_keys($norm),
                'customer_id'       => $norm['customer_id'] ?? null,
                'send_flg'          => $norm['send_flg'] ?? null,
                'rate_header'       => $norm['rate'] ?? null,
                'details_count'     => isset($norm['details']) && is_array($norm['details']) ? count($norm['details']) : 0,
            ]);

            // 「届け先入力があれば send_flg に関係なく配送先を保存」する
            $hasDeliveryInput =
                !empty($norm['name']) ||
                !empty($norm['zip_code']) ||
                !empty($norm['address1']) ||
                !empty($norm['address2']) ||
                !empty($norm['tel']);

            $deliveryId = null;

            // customer_id があるときだけ m_delivery_addresses を作成
            if (!empty($norm['customer_id']) && (!empty($norm['send_flg']) || $hasDeliveryInput)) {
                $delivery = new DeliveryAddress();
                $delivery->recipient_name = $norm['name'] ?? '';
                $delivery->zip_code       = $norm['zip_code'] ?? '';
                $delivery->prefectures    = '';
                $delivery->municipality   = ($norm['address1'] ?? '') ?: '-';
                $delivery->number         = ($norm['address2'] ?? '') ?: '-';
                $delivery->tel            = $norm['tel'] ?? '';

                if (Schema::hasColumn($delivery->getTable(), 'customer_id')) {
                    $delivery->customer_id = $norm['customer_id'];
                }

                $delivery->save();
                $deliveryId = $delivery->id;

                \Log::info('[SalesService][storeInternal] delivery saved', [
                    'delivery_id' => $deliveryId,
                ]);
            } elseif (empty($norm['customer_id']) && (!empty($norm['send_flg']) || $hasDeliveryInput)) {
                \Log::warning('[SalesService][storeInternal] skip delivery insert because customer_id is empty', [
                    'customer_id' => $norm['customer_id'] ?? null,
                ]);
            }

            // Sales 本体
            $sales = new Sales();
            $table = $sales->getTable();

            $sales->sales_at = $norm['sales_at'] ?? null;
            if (Schema::hasColumn($table, 'delivery_date')) {
                $sales->delivery_date = $norm['delivery_date'] ?? null;
            }
            $sales->customer_id = $norm['customer_id'] ?? null;

            // send_flg / is_send 両対応（UI表示用フラグであり、配送先の保存とは切り離す）
            if (Schema::hasColumn($table, 'send_flg')) {
                $sales->send_flg = !empty($norm['send_flg']) ? 1 : 0;
            } elseif (Schema::hasColumn($table, 'is_send')) {
                $sales->is_send = !empty($norm['send_flg']) ? 1 : 0;
            }

            // 住所系（存在時のみ代入）
            if (Schema::hasColumn($table, 'name'))     $sales->name     = $norm['name'] ?? null;
            if (Schema::hasColumn($table, 'zip_code')) $sales->zip_code = $norm['zip_code'] ?? null;
            if (Schema::hasColumn($table, 'address1')) $sales->address1 = $norm['address1'] ?? null;
            if (Schema::hasColumn($table, 'address2')) $sales->address2 = $norm['address2'] ?? null;

            // TEL / 送り先系（存在するカラムにだけ入れる）
            if (Schema::hasColumn($table, 'tel'))              $sales->tel              = $norm['tel'] ?? null;
            if (Schema::hasColumn($table, 'ship_to_tel'))      $sales->ship_to_tel      = $norm['tel'] ?? null;
            if (Schema::hasColumn($table, 'ship_to_name'))     $sales->ship_to_name     = $norm['name'] ?? null;
            if (Schema::hasColumn($table, 'ship_to_zip_code')) $sales->ship_to_zip_code = $norm['zip_code'] ?? null;
            if (Schema::hasColumn($table, 'ship_to_address1')) $sales->ship_to_address1 = $norm['address1'] ?? null;
            if (Schema::hasColumn($table, 'ship_to_address2')) $sales->ship_to_address2 = $norm['address2'] ?? null;

            if (Schema::hasColumn($table, 'fax')) $sales->fax = $norm['fax'] ?? null;

            //  担当者（personnel_id）：未指定なら管理者を補完
            $personnelId = $norm['user_id'] ?? null;
            if (!$personnelId) {
                $defaultPersonnel = $this->getDefaultPersonnel();
                $personnelId = $defaultPersonnel['id'] ?? null;
            }
            if (Schema::hasColumn($table, 'personnel_id')) {
                $sales->personnel_id = $personnelId;
            }

            if (Schema::hasColumn($table, 'shipping_amount'))  $sales->shipping_amount = $norm['shipping_amount'] ?? 0;
            if (Schema::hasColumn($table, 'fee'))              $sales->fee             = $norm['fee'] ?? 0;
            if (Schema::hasColumn($table, 'discount'))         $sales->discount        = $norm['discount'] ?? 0;
            $sales->total_amount = $norm['total_amount'] ?? 0;
            if (Schema::hasColumn($table, 'order_no'))         $sales->order_no        = $norm['order_no'] ?? null;
            if (Schema::hasColumn($table, 'remarks'))          $sales->remarks         = $norm['remarks'] ?? null;
            if (Schema::hasColumn($table, 'rate'))             $sales->rate            = $norm['rate'] ?? 100;
            if (Schema::hasColumn($table, 'sales_tax_rate'))   $sales->sales_tax_rate  = $norm['sales_tax_rate'] ?? null;
            if (Schema::hasColumn($table, 'fraction'))         $sales->fraction        = $norm['fraction'] ?? 1;
            if (Schema::hasColumn($table, 'delivery_id'))      $sales->delivery_id     = $deliveryId;
            if (Schema::hasColumn($table, 'has_invoice'))      $sales->has_invoice     = !empty($norm['has_invoice']) ? 1 : 0;
            if (Schema::hasColumn($table, 'receive_order_id')) $sales->receive_order_id= $norm['receive_order_id'] ?? null;

            // payment_id（列がある場合に設定）
            if (Schema::hasColumn($table, 'payment_id')) {
                $sales->payment_id = $this->resolvePaymentId($norm['corporate_class'] ?? null);
            }

            // ヘッダ item_id（列がある場合は明細の先頭 item_id を補完）
            if (Schema::hasColumn($table, 'item_id')) {
                $firstItemId = null;
                foreach (($norm['details'] ?? []) as $d) {
                    if (!empty($d['item_id'])) {
                        $firstItemId = (int)$d['item_id'];
                        break;
                    }
                }
                $sales->item_id = $firstItemId ?? 0;
            }

            $sales->save();

            // 明細（可変カラム存在チェックつき）
            $dtTable = $sales->details()->getModel()->getTable();
            $payload = [];

            // ヘッダ掛率（得意先掛率など）を fallback 用に保持
            $headerRate = $norm['rate'] ?? 100;

            foreach (($norm['details'] ?? []) as $idx => $d) {
                $detailRate = $d['rate'] ?? $headerRate ?? 100;

                $row = [
                    'no'         => $d['no']        ?? ($idx + 1),
                    'item_id'    => $d['item_id']   ?? null,
                    'unit_price' => $d['unit_price']?? 0,
                    'quantity'   => $d['quantity']  ?? 0,
                    'amount'     => $d['amount']    ?? 0,
                ];

                if (Schema::hasColumn($dtTable, 'item_kind'))        $row['item_kind']        = $d['item_kind'] ?? null;
                if (Schema::hasColumn($dtTable, 'sales_unit_price')) $row['sales_unit_price'] = $d['sales_unit_price'] ?? 0;

                //  明細ごとの rate → 無ければヘッダ rate → さらに無ければ 100
                if (Schema::hasColumn($dtTable, 'rate')) {
                    $row['rate'] = (int)$detailRate;
                }

                if (Schema::hasColumn($dtTable, 'sales_tax_rate'))   $row['sales_tax_rate']   = $d['sales_tax_rate'] ?? null;
                if (Schema::hasColumn($dtTable, 'fraction'))         $row['fraction']         = $d['fraction'] ?? 1;

                \Log::debug('[SalesService][storeInternal] detail row', [
                    'no'           => $row['no'],
                    'item_id'      => $row['item_id'],
                    'rate_in'      => $d['rate'] ?? null,
                    'rate_saved'   => $row['rate'] ?? null,
                    'header_rate'  => $headerRate,
                ]);

                $payload[] = $row;
            }

            if (!empty($payload)) {
                $sales->details()->createMany($payload);
            }

            \Log::info('[SalesService][storeInternal] completed', [
                'sale_id'      => $sales->id,
                'delivery_id'  => $deliveryId,
                'personnel_id' => $sales->personnel_id,
            ]);

            return (int)$sales->id;
        });
    }

    /**
     * 実処理：更新（例外を上位に投げる）
     * @throws \Throwable
     */
    private function updateInternal(int $id, array $norm): void
    {
        DB::transaction(function () use ($id, $norm) {

            /** @var Sales $sales */
            $sales = Sales::with(['details'])->findOrFail($id);
            $table = $sales->getTable();

            \Log::info('[SalesService][updateInternal] start', [
                'sale_id'          => $id,
                'keys'             => array_keys($norm),
                'customer_id'      => $norm['customer_id'] ?? null,
                'send_flg'         => $norm['send_flg'] ?? null,
                'rate_header'      => $norm['rate'] ?? null,
                'details_count'    => isset($norm['details']) && is_array($norm['details']) ? count($norm['details']) : 0,
            ]);

            // 「届け先入力があれば send_flg に関係なく配送先を保存」
            $hasDeliveryInput =
                !empty($norm['name']) ||
                !empty($norm['zip_code']) ||
                !empty($norm['address1']) ||
                !empty($norm['address2']) ||
                !empty($norm['tel']);

            if (!empty($norm['customer_id']) && (!empty($norm['send_flg']) || $hasDeliveryInput)) {
                $delivery = $sales->delivery_id
                    ? DeliveryAddress::find($sales->delivery_id)
                    : new DeliveryAddress();

                $delivery->recipient_name = $norm['name'] ?? '';
                $delivery->zip_code       = $norm['zip_code'] ?? '';
                $delivery->prefectures    = '';
                $delivery->municipality   = ($norm['address1'] ?? '') ?: '-';
                $delivery->number         = ($norm['address2'] ?? '') ?: '-';
                $delivery->tel            = $norm['tel'] ?? '';

                if (Schema::hasColumn($delivery->getTable(), 'customer_id')) {
                    $delivery->customer_id = $norm['customer_id'];
                }

                $delivery->save();
                if (Schema::hasColumn($table, 'delivery_id')) {
                    $sales->delivery_id = $delivery->id;
                }

                \Log::info('[SalesService][updateInternal] delivery saved/updated', [
                    'delivery_id' => $delivery->id,
                ]);
            } elseif (empty($norm['customer_id']) && (!empty($norm['send_flg']) || $hasDeliveryInput)) {
                \Log::warning('[SalesService][updateInternal] skip delivery insert because customer_id is empty', [
                    'customer_id' => $norm['customer_id'] ?? null,
                ]);
            }

            // 本体
            $sales->sales_at = $norm['sales_at'] ?? null;
            if (Schema::hasColumn($table, 'delivery_date')) {
                $sales->delivery_date = $norm['delivery_date'] ?? null;
            }
            $sales->customer_id = $norm['customer_id'] ?? null;

            // send_flg / is_send 両対応
            if (Schema::hasColumn($table, 'send_flg')) {
                $sales->send_flg = !empty($norm['send_flg']) ? 1 : 0;
            } elseif (Schema::hasColumn($table, 'is_send')) {
                $sales->is_send = !empty($norm['send_flg']) ? 1 : 0;
            }

            // 住所系（存在時のみ代入）
            if (Schema::hasColumn($table, 'name'))     $sales->name     = $norm['name'] ?? null;
            if (Schema::hasColumn($table, 'zip_code')) $sales->zip_code = $norm['zip_code'] ?? null;
            if (Schema::hasColumn($table, 'address1')) $sales->address1 = $norm['address1'] ?? null;
            if (Schema::hasColumn($table, 'address2')) $sales->address2 = $norm['address2'] ?? null;

            // TEL / 送り先系
            if (Schema::hasColumn($table, 'tel'))              $sales->tel              = $norm['tel'] ?? null;
            if (Schema::hasColumn($table, 'ship_to_tel'))      $sales->ship_to_tel      = $norm['tel'] ?? null;
            if (Schema::hasColumn($table, 'ship_to_name'))     $sales->ship_to_name     = $norm['name'] ?? null;
            if (Schema::hasColumn($table, 'ship_to_zip_code')) $sales->ship_to_zip_code = $norm['zip_code'] ?? null;
            if (Schema::hasColumn($table, 'ship_to_address1')) $sales->ship_to_address1 = $norm['address1'] ?? null;
            if (Schema::hasColumn($table, 'ship_to_address2')) $sales->ship_to_address2 = $norm['address2'] ?? null;

            if (Schema::hasColumn($table, 'fax')) $sales->fax = $norm['fax'] ?? null;

            //  担当者（personnel_id）：送られてきた user_id を優先しつつ、なければ既存値 or 管理者
            $personnelId = $norm['user_id'] ?? $sales->personnel_id ?? null;
            if (!$personnelId) {
                $defaultPersonnel = $this->getDefaultPersonnel();
                $personnelId = $defaultPersonnel['id'] ?? null;
            }
            if (Schema::hasColumn($table, 'personnel_id')) {
                $sales->personnel_id = $personnelId;
            }

            if (Schema::hasColumn($table, 'shipping_amount'))  $sales->shipping_amount = $norm['shipping_amount'] ?? 0;
            if (Schema::hasColumn($table, 'fee'))              $sales->fee             = $norm['fee'] ?? 0;
            if (Schema::hasColumn($table, 'discount'))         $sales->discount        = $norm['discount'] ?? 0;
            $sales->total_amount = $norm['total_amount'] ?? 0;
            if (Schema::hasColumn($table, 'order_no'))         $sales->order_no        = $norm['order_no'] ?? null;
            if (Schema::hasColumn($table, 'remarks'))          $sales->remarks         = $norm['remarks'] ?? null;
            if (Schema::hasColumn($table, 'rate'))             $sales->rate            = $norm['rate'] ?? 100;
            if (Schema::hasColumn($table, 'sales_tax_rate'))   $sales->sales_tax_rate  = $norm['sales_tax_rate'] ?? null;
            if (Schema::hasColumn($table, 'fraction'))         $sales->fraction        = $norm['fraction'] ?? 1;
            if (Schema::hasColumn($table, 'has_invoice'))      $sales->has_invoice     = !empty($norm['has_invoice']) ? 1 : 0;
            if (Schema::hasColumn($table, 'receive_order_id')) $sales->receive_order_id= $norm['receive_order_id'] ?? null;

            // payment_id（列がある場合に設定）
            if (Schema::hasColumn($table, 'payment_id')) {
                $sales->payment_id = $this->resolvePaymentId($norm['corporate_class'] ?? null);
            }

            // ヘッダ item_id（列がある場合は明細の先頭 item_id を補完）
            if (Schema::hasColumn($table, 'item_id')) {
                $firstItemId = null;
                foreach (($norm['details'] ?? []) as $d) {
                    if (!empty($d['item_id'])) {
                        $firstItemId = (int)$d['item_id'];
                        break;
                    }
                }
                $sales->item_id = $firstItemId ?? 0;
            }

            $sales->save();

            // 明細は全入れ替え
            $sales->details()->delete();

            // 明細（可変カラム存在チェックつき）
            $dtTable = $sales->details()->getModel()->getTable();
            $payload = [];

            // ヘッダ掛率（得意先掛率など）を fallback 用に保持
            $headerRate = $norm['rate'] ?? 100;

            foreach (($norm['details'] ?? []) as $idx => $d) {
                $detailRate = $d['rate'] ?? $headerRate ?? 100;

                $row = [
                    'no'         => $d['no']        ?? ($idx + 1),
                    'item_id'    => $d['item_id']   ?? null,
                    'unit_price' => $d['unit_price']?? 0,
                    'quantity'   => $d['quantity']  ?? 0,
                    'amount'     => $d['amount']    ?? 0,
                ];

                if (Schema::hasColumn($dtTable, 'item_kind'))        $row['item_kind']        = $d['item_kind'] ?? null;
                if (Schema::hasColumn($dtTable, 'sales_unit_price')) $row['sales_unit_price'] = $d['sales_unit_price'] ?? 0;

                //  明細ごとの rate → 無ければヘッダ rate → さらに無ければ 100
                if (Schema::hasColumn($dtTable, 'rate')) {
                    $row['rate'] = (int)$detailRate;
                }

                if (Schema::hasColumn($dtTable, 'sales_tax_rate'))   $row['sales_tax_rate']   = $d['sales_tax_rate'] ?? null;
                if (Schema::hasColumn($dtTable, 'fraction'))         $row['fraction']         = $d['fraction'] ?? 1;

                \Log::debug('[SalesService][updateInternal] detail row', [
                    'no'           => $row['no'],
                    'item_id'      => $row['item_id'],
                    'rate_in'      => $d['rate'] ?? null,
                    'rate_saved'   => $row['rate'] ?? null,
                    'header_rate'  => $headerRate,
                ]);

                $payload[] = $row;
            }

            if (!empty($payload)) {
                $sales->details()->createMany($payload);
            }

            \Log::info('[SalesService][updateInternal] completed', [
                'sale_id'      => $sales->id,
                'personnel_id' => $sales->personnel_id,
            ]);
        });
    }
    private function cfg(array $config, array $keys, $default = '')
    {
        foreach ($keys as $k) {
            if (array_key_exists($k, $config) && $config[$k] !== null && $config[$k] !== '') {
                return $config[$k];
            }
        }
        return $default;
    }
}
