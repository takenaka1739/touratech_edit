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
     * 売上明細（1行）を新規作成する
     *
     * ポイント:
     * - テーブル/列の揺れを hasColumnSafe で吸収し、存在する列だけ埋める
     * - discount を正規化して保存
     * - sales_tax_rate/sales_tax/amount は「無ければ計算して埋める」
     * - 受注由来の場合は受注明細⇔売上明細の連結も作成する
     */
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

        // 受注由来の場合は「受注明細⇔売上明細」の連結を作る
        if ($receive_order_id) {
            $receive_detail_id = $detail->get('receive_order_detail_id');
            $this->insertReceiveOrderDetailSalesDetail($receive_detail_id, (int)$m->id);
        }
    }

    /**
     * 売上明細（既存行）を更新する
     *
     * ポイント:
     * - discount を create と同じ手順で正規化して保存
     * - sales_tax_rate/sales_tax/amount は「無ければ計算して埋める」
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

    /**
     * 明細の削除（差分削除）
     *
     * 方針:
     * - DB上の既存明細ID一覧（prevIds）と、payload上の明細ID一覧（currentIds）を比較し、
     *   payload に存在しないIDだけ削除する。
     *
     * 注意:
     * - DB::table(...)->delete() は SoftDeletes を考慮しない（物理delete）。
     *   SalesDetail が SoftDeletes を使う運用なら、モデル経由 delete を検討余地あり。
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
     * 重要（今回の ship_to_* 不具合の最重要ポイント）:
     * - この実装は「フロントが送る name/zip_code/address... を ship_to_* に保存する」仕様。
     * - つまり、フロントの name/zip/address/tel は “請求先” ではなく “送り先” として t_sales に入る。
     *
     * そのため、編集画面で ship_to_* を表示したい場合は、
     * - get() のレスポンスに ship_to_* を含める
     * - さらにフロントが ship_to_* を表示欄に使う（name ではなく ship_to_name など）
     * が必要。
     *
     * 逆に、編集画面が name/zip/address... を表示している場合、
     * - get() 側で ship_to_* → name/zip/address... にマッピングして返さない限り表示されない。
     * （これが「DBにはあるのに編集に出ない」の典型的な原因）
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

        /**
         * ★宛先系カラムの実体は ship_to_*（このテーブル構造）
         * 旧実装の name/zip_code/address... では保存されないため、
         * 入力キー（name等）→保存先（ship_to_*）にマッピングする。
         *
         * ※この設計を採るなら、
         *   - 編集画面表示側でも ship_to_* を使う（または get() で name等へ詰め替える）
         *   のどちらかに統一しないと、値が「入っているのに見えない」状態が起きる。
         */
        $shipMap = [
            'name'     => 'ship_to_name',
            'zip_code' => 'ship_to_zip_code',
            'address1' => 'ship_to_address1',
            'address2' => 'ship_to_address2',
            'tel'      => 'ship_to_tel',
            // t_sales に ship_to_fax は無いので対象外
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
                // クリア操作（空文字）も反映したいので、has() ではなく get() でセットする
                $sales->{$col} = $data->get($inputKey);
            }
        }

        // 旧テーブルに fax 列がある環境だけ保存
        if ($this->hasColumnSafe('t_sales', 'fax')) {
            $sales->fax = $data->get('fax');
        }

        // 金額系（存在する列だけセット）
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

        // 担当者（personnel_id or user_id の揺れ）
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

        // 代表商品（ヘッダに item_id を持つ構造の場合のみ）
        if ($this->hasColumnSafe('t_sales', 'item_id')) {
            $firstItemId = 0;
            $details = $data->get('details') ?? [];
            foreach ($details as $d) {
                $iid = (int)($d['item_id'] ?? 0);
                if ($iid > 0) { $firstItemId = $iid; break; }
            }
            $sales->item_id = $firstItemId;
        }

        // corporate_class は t_sales に無い前提（payment_id から復元する設計）
        if ($this->hasColumnSafe('t_sales', 'corporate_class') && $data->has('corporate_class')) {
            $sales->corporate_class = $data->get('corporate_class');
        }

        // payment_id（入力優先。無ければ corporate_class から解決）
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
     * - taxable = unit_price * quantity - discount（マイナスにならないよう max）
     * - tax は fraction（1:切捨 2:四捨五入 3:切上）で丸める
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

        // discount は resolve を使って正規化（create/update と同一ロジック）
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

    /**
     * デフォルト税率（m_configs.sales_tax_rate から取得。取れない場合は 10）
     *
     * ※SalesService 側にも resolveSalesTaxRate() があり、役割が重複している。
     *   「不要メソッド削除（優先度2）」の候補として、どちらかに寄せるのが望ましい。
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
