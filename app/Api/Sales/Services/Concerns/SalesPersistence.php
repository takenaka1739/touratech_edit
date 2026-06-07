<?php

namespace App\Api\Sales\Services\Concerns;

use App\Base\Models\Sales;
use App\Base\Models\SalesDetail;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

trait SalesPersistence
{
    /**
     * 売上明細をまとめて登録する
     *
     * - $details は配列（フロント payload の details）を想定
     * - 1件ずつ createDetailItems() に委譲して保存する
     * - $receive_order_id がある場合は受注明細⇔売上明細の連結も作る（createDetailItems 内）
     */
    private function insertDetails(int $sales_id, $details, $receive_order_id = null): void
    {
        if (!$details) return;

        foreach ($details as $detail) {
            $detail = new Collection($detail);
            $this->createDetailItems($sales_id, $detail, $receive_order_id);
        }
    }

    /**
     * 売上明細を更新する（差し替え方式）
     *
     * 方針:
     * - deleteDetails() で「現在payloadに存在しない明細」を削除
     * - payloadの各明細について
     *   - id があれば updateDetailItems()
     *   - id がなければ createDetailItems()
     */
    private function updateDetails(int $sales_id, $details): void
    {
        $this->deleteDetails($sales_id, $details);

        if (!$details) return;

        foreach ($details as $detail) {
            $detail = new Collection($detail);
            $id = $detail->get('id');

            if ($id) {
                $this->updateDetailItems((int)$id, $sales_id, $detail);
            } else {
                $this->createDetailItems($sales_id, $detail, null);
            }
        }
    }

    /**
     * ★rate の入力揺れ/NULL を吸収して正規化（整数化）する
     *
     * 目的:
     * - t_sale_details.rate に NULL が入ってしまう経路を潰す
     * - バリデーション（rateは整数）で 500 になるのを防ぐ
     *
     * 仕様:
     * - null / '' / 0 以下 は 100 扱い
     */
    private function resolveDetailRate(Collection $detail): int
    {
        $v = $detail->get('rate');

        if ($v === null || $v === '') {
            return 100;
        }

        $n = (int)$v;
        return $n > 0 ? $n : 100;
    }

    /**
     * ★discount の入力キー揺れを吸収して正規化（数値化）する
     *
     * 目的:
     * - 過去に discount キーが複数名で混在した運用の吸収
     * - 税計算（fillTaxAndAmountForDetailModel）に入る前に必ず数値へ正規化する
     */
    private function resolveDetailDiscount(Collection $detail): float
    {
        $v = $detail->get('discount');

        if ($v === null || $v === '') {
            foreach (['detail_discount', 'discount_amount', 'discount_value'] as $alt) {
                $altVal = $detail->get($alt);
                if ($altVal !== null && $altVal !== '') {
                    $v = $altVal;
                    break;
                }
            }
        }

        if ($v === null || $v === '') return 0.0;

        return (float)$v;
    }

    /**
     * ★（追加）得意先マスタの fraction を取得して正規化
     *
     * 仕様（ユーザー指定）:
     * - 1: 切り捨て
     * - 2: 切り上げ
     * - 3: 四捨五入
     *
     * 返却:
     * - 1/2/3 のいずれか、取得できなければ null
     */
    private function resolveCustomerFraction(?int $customerId): ?int
    {
        if (!$customerId || $customerId <= 0) return null;

        // テーブル/列が存在しない環境も考慮
        if (!$this->hasColumnSafe('t_customers', 'id')) return null;
        if (!$this->hasColumnSafe('t_customers', 'fraction')) return null;

        // SoftDeletes 環境を吸収
        $q = DB::table('t_customers')->where('id', $customerId);
        if ($this->hasColumnSafe('t_customers', 'deleted_at')) {
            $q->whereNull('deleted_at');
        }

        $v = $q->value('fraction');
        if ($v === null || $v === '') return null;

        $n = (int)$v;
        return in_array($n, [1, 2, 3], true) ? $n : null;
    }

    /**
     * 売上明細（1行）を新規作成する
     */
    private function createDetailItems(int $sales_id, Collection $detail, $receive_order_id = null): void
    {
        $item_kind = (int)$detail->get('item_kind');
        $item_id   = (int)$detail->get('item_id');
        if (in_array($item_kind, [1, 3], true) && $item_id <= 0) {
            throw new \RuntimeException("invalid sales detail: item_id is missing (item_kind={$item_kind})");
        }

        /** @var SalesDetail $m */
        $m = new SalesDetail();
        $m->sale_id          = $sales_id;
        $m->no               = (int)$detail->get('no');
        $m->item_kind        = $item_kind;
        $m->item_id          = $item_id;

        // ★ 実テーブル名はモデルから取得（揺れ回避）
        $detailTable = $m->getTable();

        if ($this->hasColumnSafe($detailTable, 'sales_unit_price')) $m->sales_unit_price = $detail->get('sales_unit_price');

        // ★ rate: NULL/空なら 100 を入れて必ず整数化
        if ($this->hasColumnSafe($detailTable, 'rate'))            $m->rate            = $this->resolveDetailRate($detail);

        if ($this->hasColumnSafe($detailTable, 'fraction')) {
            $m->fraction = $detail->get('fraction') !== null ? (int)$detail->get('fraction') : 1;
        }

        $m->unit_price       = $detail->get('unit_price');
        $m->quantity         = $detail->get('quantity');

        // ===== discount: 入力キー揺れを吸収して保存 =====
        $incomingDiscount = $this->resolveDetailDiscount($detail);
        $hasDiscountCol = $this->hasColumnSafe($detailTable, 'discount');

        if (config('app.debug')) {
            Log::info('[SalesPersistence] create detail (before discount set)', [
                'detail_table' => $detailTable,
                'has_discount_col' => $hasDiscountCol,
                'sale_id' => $sales_id,
                'detail_no' => $detail->get('no'),
                'detail_id' => $detail->get('id'),
                'keys' => array_keys($detail->toArray()),
                'incoming_discount_raw' => $detail->get('discount'),
                'incoming_discount_resolved' => $incomingDiscount,
                'incoming_amount' => $detail->get('amount'),
                'incoming_sales_tax' => $detail->get('sales_tax'),
                'incoming_sales_tax_rate' => $detail->get('sales_tax_rate'),
            ]);
        }

        if ($hasDiscountCol) {
            $m->discount = $incomingDiscount;
        }

        // sales_tax_rate / sales_tax / amount を「無ければ計算して埋める」
        // ★修正: incoming がある場合は優先して採用（fillTaxAndAmountForDetailModel 側で対応）
        $this->fillTaxAndAmountForDetailModel($m, $detail);

        if ($this->hasColumnSafe($detailTable, 'item_number'))   $m->item_number   = $detail->get('item_number');
        if ($this->hasColumnSafe($detailTable, 'item_name'))     $m->item_name     = $detail->get('item_name');
        if ($this->hasColumnSafe($detailTable, 'item_name_jp'))  $m->item_name_jp  = $detail->get('item_name_jp');
        if ($this->hasColumnSafe($detailTable, 'parent_id'))     $m->parent_id     = $detail->get('parent_id');

        if (config('app.debug')) {
            Log::info('[SalesPersistence] create detail (before save snapshot)', [
                'sale_id' => $sales_id,
                'detail_no' => $m->no,
                'model_discount' => $m->discount ?? null,
                'model_amount' => $m->amount ?? null,
                'model_sales_tax' => $m->sales_tax ?? null,
                'model_sales_tax_rate' => $m->sales_tax_rate ?? null,
                'model_fraction' => $m->fraction ?? null,
            ]);
        }

        $m->save();

        if (config('app.debug')) {
            $saved = SalesDetail::query()->find($m->id);
            Log::info('[SalesPersistence] create detail (after save)', [
                'saved_id' => $m->id,
                'db_discount' => $saved?->discount,
                'db_amount' => $saved?->amount,
                'db_sales_tax' => $saved?->sales_tax,
                'db_sales_tax_rate' => $saved?->sales_tax_rate,
                'db_fraction' => $saved?->fraction,
            ]);
        }

        // 受注由来の場合は「受注明細⇔売上明細」の連結を作る
        if ($receive_order_id) {
            $receive_detail_id = $detail->get('receive_order_detail_id');
            $this->insertReceiveOrderDetailSalesDetail($receive_detail_id, (int)$m->id);
        }
    }

    /**
     * 売上明細（既存行）を更新する
     */
    private function updateDetailItems(int $id, int $sales_id, Collection $detail): void
    {
        /** @var SalesDetail $m */
        $m = SalesDetail::findOrFail($id);

        $m->sale_id   = $sales_id;
        $m->no        = (int)$detail->get('no');
        $m->item_kind = (int)$detail->get('item_kind');
        $m->item_id   = (int)$detail->get('item_id');

        // ★ 実テーブル名はモデルから取得
        $detailTable = $m->getTable();

        if ($this->hasColumnSafe($detailTable, 'sales_unit_price')) $m->sales_unit_price = $detail->get('sales_unit_price');

        // ★ rate: NULL/空なら 100 を入れて必ず整数化（更新時もNULL上書きを防ぐ）
        if ($this->hasColumnSafe($detailTable, 'rate'))            $m->rate            = $this->resolveDetailRate($detail);

        if ($this->hasColumnSafe($detailTable, 'fraction')) {
            $m->fraction = $detail->get('fraction') !== null ? (int)$detail->get('fraction') : ((int)($m->fraction ?? 1));
        }

        $m->unit_price = $detail->get('unit_price');
        $m->quantity   = $detail->get('quantity');

        // ===== discount: update 側も同様に可視化 =====
        $incomingDiscount = $this->resolveDetailDiscount($detail);
        $hasDiscountCol = $this->hasColumnSafe($detailTable, 'discount');

        if (config('app.debug')) {
            Log::info('[SalesPersistence] update detail (before discount set)', [
                'detail_table' => $detailTable,
                'has_discount_col' => $hasDiscountCol,
                'sale_id' => $sales_id,
                'detail_id' => $id,
                'detail_no' => $detail->get('no'),
                'keys' => array_keys($detail->toArray()),
                'incoming_discount_raw' => $detail->get('discount'),
                'incoming_discount_resolved' => $incomingDiscount,
                'before_model_discount' => $m->discount,
                'incoming_amount' => $detail->get('amount'),
                'incoming_sales_tax' => $detail->get('sales_tax'),
                'incoming_sales_tax_rate' => $detail->get('sales_tax_rate'),
            ]);
        }

        if ($hasDiscountCol) {
            $m->discount = $incomingDiscount;
        }

        // ★修正: incoming がある場合は優先して採用（fillTaxAndAmountForDetailModel 側で対応）
        $this->fillTaxAndAmountForDetailModel($m, $detail);

        if ($this->hasColumnSafe($detailTable, 'item_number'))   $m->item_number   = $detail->get('item_number');
        if ($this->hasColumnSafe($detailTable, 'item_name'))     $m->item_name     = $detail->get('item_name');
        if ($this->hasColumnSafe($detailTable, 'item_name_jp'))  $m->item_name_jp  = $detail->get('item_name_jp');

        if (config('app.debug')) {
            Log::info('[SalesPersistence] update detail (before save snapshot)', [
                'sale_id' => $sales_id,
                'detail_id' => $id,
                'model_discount' => $m->discount ?? null,
                'model_amount' => $m->amount ?? null,
                'model_sales_tax' => $m->sales_tax ?? null,
                'model_sales_tax_rate' => $m->sales_tax_rate ?? null,
                'model_fraction' => $m->fraction ?? null,
            ]);
        }

        $m->save();

        if (config('app.debug')) {
            $saved = SalesDetail::query()->find($id);
            Log::info('[SalesPersistence] update detail (after save)', [
                'detail_id' => $id,
                'db_discount' => $saved?->discount,
                'db_amount' => $saved?->amount,
                'db_sales_tax' => $saved?->sales_tax,
                'db_sales_tax_rate' => $saved?->sales_tax_rate,
                'db_fraction' => $saved?->fraction,
            ]);
        }
    }

    /**
     * 明細の削除（差分削除）
     */
    private function deleteDetails(int $sales_id, $details): void
    {
        $detailTable = $this->salesDetailTable();

        $prevIds = DB::table($detailTable)
            ->where('sale_id', $sales_id)
            ->whereIn('item_kind', [1, 2])
            ->pluck('id')
            ->toArray();

        $currentIds = is_array($details)
            ? array_values(array_filter(array_map(fn($d) => $d['id'] ?? null, $details)))
            : [];

        $deleteIds = array_diff($prevIds, $currentIds);
        if (!empty($deleteIds)) {
            DB::table($detailTable)->whereIn('id', $deleteIds)->delete();
        }
    }

    /**
     * 売上ヘッダ（t_sales）に payload を詰める
     *
     * （このメソッドは貼ってくれた内容そのまま：省略せず全文維持）
     */
    private function fillSalesHeader(Sales $sales, Collection $data): void
    {
        $salesDateCol = $this->salesDateColumn();

        $salesDate = $data->get($salesDateCol) ?? $data->get('sales_date');
        $sales->{$salesDateCol} = $salesDate;

        if ($this->hasColumnSafe('t_sales', 'delivery_date')) {
            $sales->delivery_date = $data->get('delivery_date');
        }

        $sales->customer_id = $data->get('customer_id');

        // 送付フラグ（旧: send_flg / 新: is_send の揺れを吸収）
        if ($this->hasColumnSafe('t_sales', 'send_flg')) {
            $sales->send_flg = $data->get('send_flg') ? 1 : 0;
        } elseif ($this->hasColumnSafe('t_sales', 'is_send')) {
            $sales->is_send = $data->get('send_flg') ? 1 : 0;
        }

        $shipMap = [
            'name'     => 'ship_to_name',
            'zip_code' => 'ship_to_zip_code',
            'address1' => 'ship_to_address1',
            'address2' => 'ship_to_address2',
            'tel'      => 'ship_to_tel',
        ];

        if (config('app.debug')) {
            \Log::info('[SalesPersistence] fillSalesHeader ship_to input snapshot', [
                'sale_id' => $sales->id ?? null,
                'send_flg' => $data->get('send_flg'),
                'name' => $data->get('name'),
                'zip_code' => $data->get('zip_code'),
                'address1' => $data->get('address1'),
                'address2' => $data->get('address2'),
                'tel' => $data->get('tel'),
                'fax' => $data->get('fax'),
            ]);
        }

        foreach ($shipMap as $inputKey => $col) {
            if ($this->hasColumnSafe('t_sales', $col)) {
                $sales->{$col} = $data->get($inputKey);
            }
        }

        if ($this->hasColumnSafe('t_sales', 'fax')) {
            $sales->fax = $data->get('fax');
        }

        if ($this->hasColumnSafe('t_sales', 'shipping_amount') && $data->has('shipping_amount')) {
            $sales->shipping_amount = $data->get('shipping_amount');
        }
        if ($this->hasColumnSafe('t_sales', 'additional_shipping_amount') && $data->has('additional_shipping_amount')) {
            $sales->additional_shipping_amount = $data->get('additional_shipping_amount');
        }
        if ($this->hasColumnSafe('t_sales', 'fee') && $data->has('fee')) {
            $sales->fee = $data->get('fee');
        }
        if ($this->hasColumnSafe('t_sales', 'discount') && $data->has('discount')) {
            $sales->discount = $data->get('discount');
        }
        if ($this->hasColumnSafe('t_sales', 'total_amount') && $data->has('total_amount')) {
            $sales->total_amount = $data->get('total_amount');
        }
        if ($this->hasColumnSafe('t_sales', 'remarks') && $data->has('remarks')) {
            $sales->remarks = $data->get('remarks');
        }
        if ($this->hasColumnSafe('t_sales', 'order_no') && $data->has('order_no')) {
            $sales->order_no = $data->get('order_no');
        }

        $userId = $data->get('user_id');
        $resolvedUserId = $userId ?? Auth::id() ?? null;

        if ($this->hasColumnSafe('t_sales', 'personnel_id')) {
            if ($resolvedUserId !== null) {
                $sales->personnel_id = $resolvedUserId;
            }
        } elseif ($this->hasColumnSafe('t_sales', 'user_id')) {
            if ($resolvedUserId !== null) {
                $sales->user_id = $resolvedUserId;
            }
        }

        if ($this->hasColumnSafe('t_sales', 'item_id')) {
            $firstItemId = 0;
            $details = $data->get('details') ?? [];
            foreach ($details as $d) {
                $iid = (int)($d['item_id'] ?? 0);
                if ($iid > 0) { $firstItemId = $iid; break; }
            }
            $sales->item_id = $firstItemId;
        }

        if ($this->hasColumnSafe('t_sales', 'corporate_class') && $data->has('corporate_class')) {
            $sales->corporate_class = $data->get('corporate_class');
        }

        if ($this->hasColumnSafe('t_sales', 'payment_id')) {
            if ($data->has('payment_id') && $data->get('payment_id')) {
                $sales->payment_id = (int)$data->get('payment_id');
            } else {
                $pid = $this->resolvePaymentId($data->get('corporate_class'));
                if (!$pid) {
                    throw new \RuntimeException('payment_id could not be resolved: m_payments has no active rows or method_code mismatch.');
                }
                $sales->payment_id = $pid;
            }
        }
    }

    /**
     * 明細の税・金額を補完/再計算してモデルへ詰める
     *
     * 仕様:
     * - sales_tax_rate が無い/0 の場合は defaultSalesTaxRate() を使う
     * - amount = unit_price * quantity（受注詳細画面の計算と同じ）
     * - tax の丸めは fraction で決める（★得意先fractionをfallbackで採用）
     *
     * ★修正:
     * - payload に amount/sales_tax/sales_tax_rate が来ている場合は「再計算せず尊重」する
     */
    private function fillTaxAndAmountForDetailModel(SalesDetail $m, Collection $detail): void
    {
        $detailTable = $m->getTable();

        $hasTaxRate = $this->hasColumnSafe($detailTable, 'sales_tax_rate');
        $hasTax     = $this->hasColumnSafe($detailTable, 'sales_tax');
        $hasAmount  = $this->hasColumnSafe($detailTable, 'amount');

        if (!$hasTaxRate && !$hasTax && !$hasAmount) {
            return;
        }

        // =========================================================
        // ★ incoming があればそれを優先（受注→売上のズレ対策）
        // =========================================================
        $incomingAmount = $detail->get('amount');
        $incomingTax    = $detail->get('sales_tax');
        $incomingRate   = $detail->get('sales_tax_rate');

        $hasIncomingAmount = !($incomingAmount === null || $incomingAmount === '');
        $hasIncomingTax    = !($incomingTax === null || $incomingTax === '');
        $hasIncomingRate   = !($incomingRate === null || $incomingRate === '' || (float)$incomingRate === 0.0);

        if ($hasIncomingRate && $hasTaxRate) {
            $m->sales_tax_rate = (float)$incomingRate;
        }

        if ($hasIncomingAmount && $hasAmount) {
            $m->amount = (int)round((float)$incomingAmount, 0);

            if ($hasIncomingTax && $hasTax) {
                $m->sales_tax = (int)round((float)$incomingTax, 0);
            }

            if (config('app.debug')) {
                Log::info('[SalesPersistence] fillTaxAndAmount: use incoming values', [
                    'sale_id' => $m->sale_id ?? null,
                    'detail_no' => $m->no ?? null,
                    'incoming_amount' => $incomingAmount,
                    'incoming_sales_tax' => $incomingTax,
                    'incoming_sales_tax_rate' => $incomingRate,
                    'model_amount' => $m->amount ?? null,
                    'model_sales_tax' => $m->sales_tax ?? null,
                    'model_sales_tax_rate' => $m->sales_tax_rate ?? null,
                ]);
            }

            return;
        }

        // =========================================================
        // incoming が無い場合のみ再計算
        // =========================================================
        $taxRate = $detail->get('sales_tax_rate');
        if ($taxRate === null || $taxRate === '' || (float)$taxRate === 0.0) {
            $taxRate = $hasTaxRate ? ($m->sales_tax_rate ?? null) : null;
            if ($taxRate === null || $taxRate === '' || (float)$taxRate === 0.0) {
                $taxRate = $this->defaultSalesTaxRate();
            }
        }

        if ($hasTaxRate) {
            $m->sales_tax_rate = (float)$taxRate;
        }

        $unitPrice = (float)($detail->get('unit_price') ?? $m->unit_price ?? 0);
        $qty       = (float)($detail->get('quantity') ?? $m->quantity ?? 0);

        /**
         * ★丸め区分の決定順（重要）
         * 1) payload details.fraction（画面側が指定してきた場合）
         * 2) DB: 得意先マスタ t_customers.fraction（t_sales.customer_id 由来）
         * 3) 明細モデルに既にある fraction（更新時）
         * 4) デフォルト（ここでは 3=四捨五入 を採用）
         */
        $fraction = null;

        // 1) payload
        $payloadFraction = $detail->get('fraction');
        if ($payloadFraction !== null && $payloadFraction !== '') {
            $pf = (int)$payloadFraction;
            if (in_array($pf, [1, 2, 3], true)) $fraction = $pf;
        }

        // 2) customer
        if ($fraction === null) {
            $customerId = null;

            // state/customer_id を payload が持つケースもある
            $cid = $detail->get('customer_id');
            if ($cid !== null && $cid !== '') {
                $customerId = (int)$cid;
            } else {
                // payloadに無いなら、sales_id から t_sales.customer_id を引く
                $salesId = (int)($m->sale_id ?? 0);
                if ($salesId > 0 && $this->hasColumnSafe('t_sales', 'customer_id')) {
                    $customerId = (int)(DB::table('t_sales')->where('id', $salesId)->value('customer_id') ?? 0);
                }
            }

            $cf = $this->resolveCustomerFraction($customerId);
            if ($cf !== null) $fraction = $cf;
        }

        // 3) model
        if ($fraction === null && $this->hasColumnSafe($detailTable, 'fraction')) {
            $mf = (int)($m->fraction ?? 0);
            if (in_array($mf, [1, 2, 3], true)) $fraction = $mf;
        }

        // 4) default
        if ($fraction === null) $fraction = 3; // 四捨五入

        // fraction をDBに持つなら保存（新規時に効く）
        if ($this->hasColumnSafe($detailTable, 'fraction')) {
            $m->fraction = (int)$fraction;
        }

        /**
         * ★ユーザー指定のマッピング:
         * 1: 切り捨て / 2: 切り上げ / 3: 四捨五入
         */
        [$amount, $salesTax] = calc_amount($unitPrice, (int)$qty, (int)$taxRate, (int)$fraction);

        if ($hasTax) {
            $m->sales_tax = (int)round($salesTax, 0);
        }
        if ($hasAmount) {
            $m->amount = (int)$amount;
        }
    }

    /**
     * デフォルト税率（m_configs.sales_tax_rate から取得。取れない場合は 10）
     */
    private function defaultSalesTaxRate(): float
    {
        if (!$this->hasColumnSafe('m_configs', 'id')) {
            return 10.0;
        }

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
}
