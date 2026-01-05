<?php

namespace App\Api\Sales\Services;

use App\Base\Models\Sales;
use App\Base\Models\SalesDetail;
use App\Base\Models\ReceiveOrder;
use App\Base\Models\Config;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;


/**
 * 売上データサービス（旧版挙動を維持したまま現行テーブルに合わせた版）
 *
 * 前提:
 * - 売上ヘッダ: t_sales
 * - 売上明細:   t_sale_details（SalesDetail::$table がこれ）
 * - 受注ヘッダ: t_receive_orders
 * - 受注明細:   t_receive_order_details
 * - 受注売上連結: t_link_r_order_sales（Sales::getReceiveOrderId() と整合）
 * - 受注売上明細連結: t_link_r_order_sales_detail
 * - 在庫: m_items.domestic_stocks（もしくは domestic_stock のどちらか）
 *
 * 注:
 * - 在庫系テーブル（inventory_*）は使いません（要件より）。
 * - 旧版の「結果として在庫が戻る/減る」挙動は、m_items を直接増減で再現します。
 */
class SalesService
{
    use Concerns\SalesSchemaResolver;
    use Concerns\SalesQueryBuilders;
    use Concerns\SalesDetailHydrator;
    use Concerns\SalesPersistence;
    use Concerns\SalesLinks;
    use Concerns\SalesStock;
    use Concerns\SalesPayments;
    use Concerns\SalesReceiveOrderStatus;

    /* =========================================================================
     |  一覧・検索（dialog / fetch / Excel）
     ========================================================================= */

    /**
     * 検索画面用の一覧データを取得する（旧版 dialog と同等）
     */
    public function dialog(array $cond): array
    {
        return $this->buildListQuery($cond)
            ->orderByDesc($this->salesDateColumn())
            ->orderByDesc('t_sales.id')
            ->paginate(config('const.paginate.per_page'))
            ->toArray();
    }

    /**
     * 一覧データを取得する（旧版 fetch と同等）
     */
    public function fetch(array $cond): array
    {
        return $this->buildListQuery($cond)
            ->orderByDesc($this->salesDateColumn())
            ->orderByDesc('t_sales.id')
            ->paginate(config('const.paginate.per_page'))
            ->toArray();
    }

    /**
     * エクセル出力用のデータを取得する（旧版 getExcelData と同等）
     */
    public function getExcelData(array $cond)
    {
        return $this->buildListQuery($cond)
            ->orderByDesc($this->salesDateColumn())
            ->orderByDesc('t_sales.id')
            ->get();
    }

    /* =========================================================================
     |  詳細
     ========================================================================= */

    /**
     * 詳細データを取得（旧版 get と同等に: details と receive_order_id を含む）
     */
    public function get(int $sales_id): array
    {
        $salesDateCol = $this->salesDateColumn();

        $q = Sales::query()->from('t_sales')
            ->select([
                't_sales.*',
                DB::raw($this->selectCustomerNameExpr() . ' as customer_name'),
                DB::raw($this->selectUserNameExpr() . ' as user_name'),
                DB::raw($this->existsInvoiceExpr() . ' as has_invoice'),
                DB::raw($this->selectReceiveOrderIdExpr() . ' as receive_order_id'),
                DB::raw("t_sales.{$salesDateCol} as sales_date"),
            ]);

        $q = $this->applyDetailJoins($q);

        $row = $q->where('t_sales.id', $sales_id)->first();
        if (!$row) return [];

        $data = $row->toArray();

        // 住所などを補完（corporate_classはcustomerから補完しない方針のまま）
        $data = $this->hydrateCustomerFieldsForEdit($data);

        if ($this->hasColumnSafe('t_sales', 'payment_id')) {
            $pid = (int)($data['payment_id'] ?? 0);
            if ($pid > 0) {
                $cc = $this->resolveCorporateClassByPaymentId($pid);
                if ($cc !== null) {
                    $data['corporate_class'] = $cc; // ← フロントのラジオはこれを見る
                }
            }
        }

        $data['details'] = $this->getDetails($sales_id);

        return $data;
    }

    /**
     * 新規作成時のデータを作成（旧版 newData 互換）
     */
    public function newData(): array
    {
        $user = Auth::user();
        $today = Carbon::today()->format('Y/m/d');

        $salesDateCol = $this->salesDateColumn();

        // ★明細モーダルの税計算に必要（CommonDataDetailDialog が salesTaxRate を参照する）
        // m_configs の sales_tax_rate を優先して取得。取得できない場合は 10 を保険値とする。
        $salesTaxRate = $this->resolveSalesTaxRate();

        return [
            $salesDateCol     => $today,
            'sales_date'      => $today, // 旧画面が sales_date を参照している可能性を残す
            'shipping_amount' => null,
            'fee'             => null,
            'discount'        => 0,
            'total_amount'    => null,
            'sales_tax_rate'  => $salesTaxRate,

            // ★要望: 消費税算出は切り捨て（1:切捨, 2:四捨五入, 3:切上）
            // 売上の新規では 1 を明示しておく（見積/受注と切り離して売上だけ切捨にしたい場合）
            'fraction'        => 1,

            'user_id'         => $user?->id,
            'user_name'       => $user?->name,
            'details'         => [],
        ];
    }

    /**
     * 受注データから売上編集データを作成（旧版 get_by_receive_id の挙動を現行テーブルへ）
     */
    public function get_by_receive_id(int $receive_order_id): array
    {
        $r = DB::table('t_receive_orders')->where('id', $receive_order_id)->first();
        if (!$r) {
            return ['success' => false, 'errors' => ['receive_order_id' => '受注が見つかりません']];
        }

        // ★売上画面側で必ず税率を持つ（モーダル計算で使う）
        $salesTaxRate = (float)($r->sales_tax_rate ?? 0);
        if ($salesTaxRate <= 0) {
            $salesTaxRate = $this->resolveSalesTaxRate();
        }

        // 受注→売上に載せる明細候補（旧版は sales_completed != 1 かつ 在庫>0 など）
        $details = $this->getDetailsByReceiveId($receive_order_id);

        // すでに売上済み数量（旧版: ReceiveOrder::getSalesQuantityGroups）
        $groups = ReceiveOrder::getSalesQuantityGroups($receive_order_id);

        $no = 1;
        foreach ($details as $d) {
            $id = $d->receive_order_detail_id;
            $d->no = $no++;

            // すでに売上済み数量
            $salesQty = $groups->has($id)
                ? (int)$groups->get($id)->sum('s_quantity')
                : 0;
            $d->sales_quantity = $salesQty;

            // 国内在庫制御
            $domestic = (int)($d->domestic_stock ?? 0);
            if ((int)$d->quantity > $domestic) {
                $d->quantity = $domestic;
            }

            // 未売上分
            $d->quantity = (int)$d->quantity - $salesQty;
            if ($d->quantity < 0) {
                $d->quantity = 0;
            }

            /* ================================
            * 割引を受注明細から引き継ぐ
            * ================================ */
            $d->discount = (float)($d->discount ?? 0);

            /* ================================
            * amount / tax を割引込みで再計算
            * ================================ */
            $unitPrice = (float)$d->unit_price;
            $qty       = (int)$d->quantity;
            $rate      = (float)$d->sales_tax_rate;
            $fraction  = (int)($d->fraction ?? 1);

            $subtotal = $unitPrice * $qty;
            $taxable  = max($subtotal - $d->discount, 0);

            $taxRaw = ($taxable * $rate) / 100;
            $salesTax = $fraction === 2
                ? round($taxRaw)
                : ($fraction === 3 ? ceil($taxRaw) : floor($taxRaw));

            $d->sales_tax = (int)$salesTax;
            $d->amount    = $taxable + $salesTax;
        }

        $details_amount = (int)collect($details)->sum('amount');
        $shipping_amount = (float)($r->shipping_amount ?? 0);
        $fee = (float)($r->fee ?? 0);
        $discount = (float)($r->discount ?? 0);

        $total_amount = function_exists('calc_total_amount')
            ? calc_total_amount($shipping_amount, $fee, $discount, $details_amount)
            : (int)round($details_amount + $shipping_amount + $fee - $discount, 0);

        $user = Auth::user();
        $salesDateCol = $this->salesDateColumn();

        return [
            'id'               => null,
            $salesDateCol      => Carbon::today()->format('Y/m/d'),
            'sales_date'       => Carbon::today()->format('Y/m/d'),
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
            'user_id'          => $user?->id,
            'user_name'        => $user?->name,
            'shipping_amount'  => $shipping_amount,
            'fee'              => $fee,
            'discount'         => $discount,
            'total_amount'     => $total_amount,
            'order_no'         => $r->order_no ?? null,
            'remarks'          => $r->remarks ?? null,
            'rate'             => (int)($r->rate ?? 100),

            // ★要望: 売上側は切捨で扱いたい場合は 1 を優先
            'fraction'         => (int)($r->fraction ?? 1),

            'sales_tax_rate'   => $salesTaxRate,
            'details_amount'   => $details_amount,
            'receive_order_id' => (int)$r->id,
            'details'          => collect($details)->map(fn($x) => (array)$x)->toArray(),
        ];
    }

    /* =========================================================================
     |  請求連結有無
     ========================================================================= */

    public function hasInvoice(int $sales_id): bool
    {
        $tbl = $this->invoiceLinkTable();
        if (!$tbl) return false;

        return DB::table($tbl)->where('sales_id', $sales_id)->count() > 0;
    }

    public function validate_edit(int $sales_id, array $input): string
    {
        $data = new \Illuminate\Support\Collection($input);

        $customerId = $data->get('customer_id');
        if (!$customerId) {
            return "OK";
        }

        $ct = $this->resolveCustomerTable();
        if (!$ct) {
            // 得意先テーブルが見つからないなら、旧版互換としては判定不能＝OK扱い
            return "OK";
        }

        // corporate_class 列が無いなら比較できないので OK
        if (!$this->hasColumnSafe($ct, 'corporate_class')) {
            return "OK";
        }

        $customer = \Illuminate\Support\Facades\DB::table($ct)
            ->select(['id', 'corporate_class'])
            ->where('id', (int)$customerId)
            ->first();

        if (!$customer) {
            // customer が存在しないケースは旧版でも想定薄いが、ここでは OK
            return "OK";
        }

        $inputCorporate = $data->get('corporate_class');

        // 入力 corporate_class が null の場合は "違う" とみなさず OK（旧版でも実質こうなる）
        if ($inputCorporate === null || $inputCorporate === '') {
            return "OK";
        }

        if ((int)$customer->corporate_class !== (int)$inputCorporate) {
            return "NG";
        }

        return "OK";
    }

    /* =========================================================================
     |  登録・更新・削除（旧版挙動を現行テーブルで再現）
     ========================================================================= */

    public function store(array $input): array
    {
        $data = new Collection($input);

        DB::beginTransaction();
        try {
            $sales = new Sales();
            $this->fillSalesHeader($sales, $data);
            $sales->save();

            $receive_order_id = $data->get('receive_order_id');
            if ($receive_order_id) {
                $this->insertReceiveOrderSales((int)$receive_order_id, (int)$sales->id);
            }

            // 明細登録（旧版: 受注紐付けあり）
            $details = $data->get('details') ?? [];
            $this->insertDetails((int)$sales->id, $details, $receive_order_id);

            if ($receive_order_id) {
                $this->updateSalesCompleted((int)$receive_order_id);
                $this->updateHasSales((int)$receive_order_id);
            }

            // 在庫（登録なので減算）
            $this->applyStockDeltaBySaleId((int)$sales->id, -1);

            DB::commit();
            return ['success' => true, 'id' => $sales->id];
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function update(int $sales_id, array $input): array
    {
        $data = new Collection($input);

        DB::beginTransaction();
        try {
            /** @var Sales $sales */
            $sales = Sales::query()->from('t_sales')->findOrFail($sales_id);

            // 更新前の在庫差分用
            $beforeDetails = $this->getSaleStockAffectDetails($sales_id);

            // ヘッダ更新
            $this->fillSalesHeader($sales, $data);
            $sales->save();

            // 明細更新
            $details = $data->get('details') ?? [];
            $this->updateDetails($sales_id, $details);

            // 受注状態更新
            $receive_order_id = $this->getReceiveOrderIdBySaleId($sales_id);
            if ($receive_order_id) {
                $this->updateSalesCompleted((int)$receive_order_id);
                $this->updateHasSales((int)$receive_order_id);
            }

            // 在庫差分（before を戻す / after を引く）
            $this->applyStockDeltaByDetails($beforeDetails, +1); // 戻す
            $afterDetails = $this->getSaleStockAffectDetails($sales_id);
            $this->applyStockDeltaByDetails($afterDetails, -1);  // 引く

            DB::commit();
            return ['success' => true];
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function delete(int $sales_id): void
    {
        DB::transaction(function () use ($sales_id) {

            // 在庫を戻すため、削除前の対象明細を取得
            $beforeDetails = $this->getSaleStockAffectDetails($sales_id);

            $sales = Sales::query()->from('t_sales')->findOrFail($sales_id);
            $receive_order_id = $this->getReceiveOrderIdBySaleId($sales_id);

            // 明細削除（モデルが SoftDeletes の場合もあるが、旧版は delete）
            $sales->details()->delete();

            // 連結削除（存在すれば）
            $this->deleteReceiveOrderLinksBySalesId($sales_id);

            // ヘッダ削除（Sales が SoftDeletes を持つなら delete、無いなら delete でOK）
            $sales->delete();

            // 受注状態更新
            if ($receive_order_id) {
                $this->updateSalesCompleted((int)$receive_order_id);
                $this->updateHasSales((int)$receive_order_id);
            }

            // 在庫戻し（削除なので +）
            $this->applyStockDeltaByDetails($beforeDetails, +1);
        });
    }

    /**
     * システム設定から消費税率を取得
     * - m_configs の構成差異（key/value の列名揺れ）を吸収
     * - 取得できない場合は 10 を返す
     */
    private function resolveSalesTaxRate(): float
    {
        // m_configs が無い/読めない環境の保険
        try {
            if (!$this->hasColumnSafe('m_configs', 'id')) {
                return 10.0;
            }
        } catch (\Throwable $e) {
            return 10.0;
        }

        // key/name の揺れ吸収
        $keyCol = null;
        foreach (['key', 'name', 'config_key', 'code'] as $c) {
            if ($this->hasColumnSafe('m_configs', $c)) { $keyCol = $c; break; }
        }
        $valCol = null;
        foreach (['value', 'config_value', 'val'] as $c) {
            if ($this->hasColumnSafe('m_configs', $c)) { $valCol = $c; break; }
        }
        if (!$keyCol || !$valCol) {
            return 10.0;
        }

        $q = DB::table('m_configs')->where($keyCol, 'sales_tax_rate');
        if ($this->hasColumnSafe('m_configs', 'deleted_at')) {
            $q->whereNull('deleted_at');
        }

        $v = $q->value($valCol);
        if ($v === null || $v === '') {
            return 10.0;
        }

        return (float)$v;
    }

    /**
     * PDF用データを作成する（旧版互換）
     *
     * 想定入力:
     * - ['id' => 123] もしくは
     * - ['data' => [...]] もしくは
     * - 直接 salesデータ配列（details含む）
     */
    public function getPdfData(array $input): array
    {
        // 1) 入力を吸収（data があればそれを優先）
        $payload = $input['data'] ?? $input;

        // 2) sales 本体を確定（id があればDBから取得）
        if (!empty($payload['id'])) {
        $salesId = (int)$payload['id'];

        \Log::info('[SalesService][getPdfData] refetch sales by id for PDF', [
            'id' => $salesId,
            'incoming_has_details' => isset($payload['details']) && is_array($payload['details']),
            'incoming_detail_keys_0' => (isset($payload['details'][0]) && is_array($payload['details'][0]))
                ? array_keys($payload['details'][0])
                : null,
        ]);

        $dbPayload = $this->get($salesId);

        if (!$dbPayload) {
            return [
                'id' => $salesId,
                'details' => [],
                'config_data' => [],
                'customer_data' => [],
            ];
        }

        $payload = $dbPayload;

        \Log::info('[SalesService][getPdfData] refetched details keys', [
            'id' => $salesId,
            'detail_keys_0' => (isset($payload['details'][0]) && is_array($payload['details'][0]))
                ? array_keys($payload['details'][0])
                : null,
        ]);
    }

        // 3) sales_date の補完（SalesPdfService は sales_date を見る）
        if (empty($payload['sales_date'])) {
            if (!empty($payload['sales_at'])) {
                $payload['sales_date'] = $payload['sales_at'];
            } elseif (!empty($payload[$this->salesDateColumn()])) {
                $payload['sales_date'] = $payload[$this->salesDateColumn()];
            }
        }

        // 4) config_data を取得（旧版: Config::getSelf）
        $configData = [];
        try {
            if (class_exists(Config::class) && method_exists(Config::class, 'getSelf')) {
                $configs = Config::getSelf();
                // Collection の場合もあるので吸収
                if ($configs instanceof \Illuminate\Support\Collection) {
                    $configData = $configs->toArray();
                } elseif (is_object($configs) && method_exists($configs, 'toArray')) {
                    $configData = $configs->toArray();
                } elseif (is_array($configs)) {
                    $configData = $configs;
                }
            }
        } catch (\Throwable $e) {
            // fallthrough
        }

        // Config モデルが取れない場合のフォールバック（m_configs が key/value の場合）
        if (empty($configData)) {
            try {
                if (Schema::hasTable('m_configs')) {
                    // key/name/value の揺れを吸収して key=>value 配列にする
                    $keyCol = null;
                    foreach (['key', 'name', 'config_key', 'code'] as $c) {
                        if (Schema::hasColumn('m_configs', $c)) { $keyCol = $c; break; }
                    }
                    $valCol = null;
                    foreach (['value', 'config_value', 'val'] as $c) {
                        if (Schema::hasColumn('m_configs', $c)) { $valCol = $c; break; }
                    }

                    if ($keyCol && $valCol) {
                        $q = DB::table('m_configs')->select([$keyCol, $valCol]);
                        if (Schema::hasColumn('m_configs', 'deleted_at')) $q->whereNull('deleted_at');

                        $rows = $q->get();
                        foreach ($rows as $r) {
                            $k = (string)($r->{$keyCol} ?? '');
                            if ($k === '') continue;
                            $configData[$k] = $r->{$valCol};
                        }
                    }
                }
            } catch (\Throwable $e) {
                // ignore
            }
        }

        // 5) customer_data（bank_class が必要）
        $customerData = [];
        try {
            $customerId = (int)($payload['customer_id'] ?? 0);
            if ($customerId > 0) {
                $ct = $this->resolveCustomerTable();
                if ($ct) {
                    $cols = ['id'];
                    if ($this->hasColumnSafe($ct, 'bank_class')) $cols[] = 'bank_class';
                    // 必要なら増やせる（現状は bank_class だけでPDF側の分岐が動く）

                    $c = DB::table($ct)->select($cols)->where('id', $customerId)->first();
                    if ($c) $customerData = (array)$c;
                }
            }
        } catch (\Throwable $e) {
            // ignore
        }

        // 6) sales_tax_rate の補完（無ければシステム設定から）
        $salesTaxRate = (float)($payload['sales_tax_rate'] ?? 0);
        if ($salesTaxRate <= 0) {
            $salesTaxRate = $this->resolveSalesTaxRate();
            $payload['sales_tax_rate'] = $salesTaxRate;
        }

        // 7) 返却（SalesPdfService が期待するキーを追加）
        $payload['config_data'] = $configData;
        $payload['customer_data'] = $customerData;

        return $payload;
    }

}
