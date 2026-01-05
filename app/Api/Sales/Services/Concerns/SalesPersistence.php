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
    private function insertDetails(int $sales_id, $details, $receive_order_id = null): void
    {
        if (!$details) return;

        foreach ($details as $detail) {
            $detail = new Collection($detail);
            $this->createDetailItems($sales_id, $detail, $receive_order_id);
        }
    }

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
     * ★discount の入力キー揺れを吸収して正規化（数値化）する
     */
    private function resolveDetailDiscount(Collection $detail): float
    {
        // 基本キー
        $v = $detail->get('discount');

        // 揺れ候補（プロジェクトによって過去に混在しがち）
        if ($v === null || $v === '') {
            foreach (['detail_discount', 'discount_amount', 'discount_value'] as $alt) {
                $altVal = $detail->get($alt);
                if ($altVal !== null && $altVal !== '') {
                    $v = $altVal;
                    break;
                }
            }
        }

        // 空は 0
        if ($v === null || $v === '') return 0.0;

        // 文字列 "100" / "100.00" も吸収
        return (float)$v;
    }

    private function createDetailItems(int $sales_id, Collection $detail, $receive_order_id = null): void
    {
        $item_kind = (int)$detail->get('item_kind');
        $item_id   = (int)$detail->get('item_id');

        /** @var SalesDetail $m */
        $m = new SalesDetail();
        $m->sale_id          = $sales_id;
        $m->no               = (int)$detail->get('no');
        $m->item_kind        = $item_kind;
        $m->item_id          = $item_id;

        // ★ 実テーブル名はモデルから取得（揺れ回避）
        $detailTable = $m->getTable();

        if ($this->hasColumnSafe($detailTable, 'sales_unit_price')) $m->sales_unit_price = $detail->get('sales_unit_price');
        if ($this->hasColumnSafe($detailTable, 'rate'))            $m->rate            = $detail->get('rate');

        if ($this->hasColumnSafe($detailTable, 'fraction')) {
            $m->fraction = $detail->get('fraction') !== null ? (int)$detail->get('fraction') : 1;
        }

        $m->unit_price       = $detail->get('unit_price');
        $m->quantity         = $detail->get('quantity');

        // ===== discount: ここが今回の主役 =====
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

        // ★ sales_tax_rate / sales_tax / amount を「無ければ計算して埋める」
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
            ]);
        }

        if ($receive_order_id) {
            $receive_detail_id = $detail->get('receive_order_detail_id');
            $this->insertReceiveOrderDetailSalesDetail($receive_detail_id, (int)$m->id);
        }
    }

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
        if ($this->hasColumnSafe($detailTable, 'rate'))            $m->rate            = $detail->get('rate');

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
            ]);
        }

        if ($hasDiscountCol) {
            $m->discount = $incomingDiscount;
        }

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
            ]);
        }
    }

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

    // fillSalesHeader / fillTaxAndAmountForDetailModel / defaultSalesTaxRate は現状のまま（省略せずに残す）
    // ---- 以下、あなたが貼ってくれた現行実装をそのまま維持 ----

    private function fillSalesHeader(Sales $sales, Collection $data): void
    {
        $salesDateCol = $this->salesDateColumn();

        $salesDate = $data->get($salesDateCol) ?? $data->get('sales_date');
        $sales->{$salesDateCol} = $salesDate;

        if ($this->hasColumnSafe('t_sales', 'delivery_date')) {
            $sales->delivery_date = $data->get('delivery_date');
        }

        $sales->customer_id = $data->get('customer_id');

        if ($this->hasColumnSafe('t_sales', 'send_flg')) {
            $sales->send_flg = $data->get('send_flg') ? 1 : 0;
        } elseif ($this->hasColumnSafe('t_sales', 'is_send')) {
            $sales->is_send = $data->get('send_flg') ? 1 : 0;
        }

        /**
         * ★宛先系カラムの実体は ship_to_*（このテーブル構造）
         * 旧実装の name/zip_code/address... では保存されないため、
         * 入力キー（name等）→保存先（ship_to_*）にマッピングする。
         *
         * フロント側は name/zip_code/address1/address2/tel/fax を送ってくる想定でOK。
         */
        $shipMap = [
            'name'     => 'ship_to_name',
            'zip_code' => 'ship_to_zip_code',
            'address1' => 'ship_to_address1',
            'address2' => 'ship_to_address2',
            'tel'      => 'ship_to_tel',
            // t_sales に ship_to_fax は無いので対象外
        ];

        // デバッグログ：validated に何が来ているか、ship_to に何を入れるか
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
                // empty も保存したい（クリア操作）可能性があるので has() で判定せず get() で入れる
                $sales->{$col} = $data->get($inputKey);
            }
        }

        // 旧テーブルに存在する可能性がある fax を保存したい場合は、t_sales側にカラムがある時だけ
        //（今回のDDLでは fax列が無いのでここは実質何もしない）
        if ($this->hasColumnSafe('t_sales', 'fax')) {
            $sales->fax = $data->get('fax');
        }

        if ($this->hasColumnSafe('t_sales', 'shipping_amount') && $data->has('shipping_amount')) {
            $sales->shipping_amount = $data->get('shipping_amount');
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

        // ★DDLに corporate_class は無い。payment_id で持つ設計なので corporate_class は保存しない。
        // ※validate_edit の比較用に corporate_class を payload に持つのはOK（DB保存は別）
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

    private function fillTaxAndAmountForDetailModel(SalesDetail $m, Collection $detail): void
    {
        $detailTable = $m->getTable();

        $hasTaxRate = $this->hasColumnSafe($detailTable, 'sales_tax_rate');
        $hasTax     = $this->hasColumnSafe($detailTable, 'sales_tax');
        $hasAmount  = $this->hasColumnSafe($detailTable, 'amount');

        if (!$hasTaxRate && !$hasTax && !$hasAmount) {
            return;
        }

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

        // ★discount はここでも resolve を使っておく（ログで原因追える）
        $disc = (float)($this->resolveDetailDiscount($detail) ?? $m->discount ?? 0);

        $subtotal = $unitPrice * $qty;
        $taxable  = max($subtotal - $disc, 0);

        $taxRaw = ($taxable * (float)$taxRate) / 100;

        $fraction = 1;
        if ($this->hasColumnSafe($detailTable, 'fraction')) {
            $fraction = (int)($detail->get('fraction') ?? $m->fraction ?? 1);
        }

        $salesTax = $fraction === 2 ? round($taxRaw) : ($fraction === 3 ? ceil($taxRaw) : floor($taxRaw));
        $amount = $taxable + $salesTax;

        if ($hasTax) {
            $m->sales_tax = (int)$salesTax;
        }
        if ($hasAmount) {
            $m->amount = $amount;
        }
    }

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
