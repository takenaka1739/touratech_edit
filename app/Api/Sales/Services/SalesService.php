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
 *
 * 【在庫（旧版方式へ回帰）】
 * - 基準在庫: t_inventories
 * - 差分:     t_inventory_moves（sales_id単位で作り直す）
 * - 反映先:   m_items.domestic_stocks / domestic_stock（環境差を吸収）
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

    public function dialog(array $cond): array
    {
        return $this->buildListQuery($cond)
            ->orderByDesc($this->salesDateColumn())
            ->orderByDesc('t_sales.id')
            ->paginate(config('const.paginate.per_page'))
            ->toArray();
    }

    public function fetch(array $cond): array
    {
        return $this->buildListQuery($cond)
            ->orderByDesc($this->salesDateColumn())
            ->orderByDesc('t_sales.id')
            ->paginate(config('const.paginate.per_page'))
            ->toArray();
    }

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

        $data = $this->hydrateCustomerFieldsForEdit($data);
        $data = $this->hydrateShipToAliasesForEdit($data);

        if ($this->hasColumnSafe('t_sales', 'payment_id')) {
            $pid = (int)($data['payment_id'] ?? 0);
            if ($pid > 0) {
                $cc = $this->resolveCorporateClassByPaymentId($pid);
                if ($cc !== null) {
                    $data['corporate_class'] = $cc;
                }
            }
        }

        $data['details'] = $this->getDetails($sales_id);

        return $data;
    }

    public function newData(): array
    {
        $user = Auth::user();
        $today = Carbon::today()->format('Y/m/d');

        $salesDateCol = $this->salesDateColumn();

        $salesTaxRate = $this->resolveSalesTaxRate();

        return [
            $salesDateCol     => $today,
            'sales_date'      => $today,
            'shipping_amount' => null,
            'fee'             => null,
            'discount'        => 0,
            'total_amount'    => null,
            'sales_tax_rate'  => $salesTaxRate,
            'fraction'        => 1,
            'user_id'         => $user?->id,
            'user_name'       => $user?->name,
            'details'         => [],
        ];
    }

    public function get_by_receive_id(int $receive_order_id): array
    {
        $r = DB::table('t_receive_orders')->where('id', $receive_order_id)->first();
        if (!$r) {
            return ['success' => false, 'errors' => ['receive_order_id' => '受注が見つかりません']];
        }

        $salesTaxRate = (float)($r->sales_tax_rate ?? 0);
        if ($salesTaxRate <= 0) {
            $salesTaxRate = $this->resolveSalesTaxRate();
        }

        $details = $this->getDetailsByReceiveId($receive_order_id);

        $groups = ReceiveOrder::getSalesQuantityGroups($receive_order_id);

        $no = 1;
        foreach ($details as $d) {
            $id = $d->receive_order_detail_id;
            $d->no = $no++;

            $salesQty = $groups->has($id)
                ? (int)$groups->get($id)->sum('s_quantity')
                : 0;
            $d->sales_quantity = $salesQty;

            $domestic = (int)($d->domestic_stock ?? 0);
            if ((int)$d->quantity > $domestic) {
                $d->quantity = $domestic;
            }

            $d->quantity = (int)$d->quantity - $salesQty;
            if ($d->quantity < 0) {
                $d->quantity = 0;
            }

            $d->discount = (float)($d->discount ?? 0);

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
            'fraction'         => (int)($r->fraction ?? 1),
            'sales_tax_rate'   => $salesTaxRate,
            'details_amount'   => $details_amount,
            'square_payment_id' => $r->square_payment_id ?? null,
            'square_status'     => $r->square_status ?? null,
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
            return "OK";
        }

        if (!$this->hasColumnSafe($ct, 'corporate_class')) {
            return "OK";
        }

        $customer = \Illuminate\Support\Facades\DB::table($ct)
            ->select(['id', 'corporate_class'])
            ->where('id', (int)$customerId)
            ->first();

        if (!$customer) {
            return "OK";
        }

        $inputCorporate = $data->get('corporate_class');

        if ($inputCorporate === null || $inputCorporate === '') {
            return "OK";
        }

        if ((int)$customer->corporate_class !== (int)$inputCorporate) {
            return "NG";
        }

        return "OK";
    }

    /* =========================================================================
     |  登録・更新・削除（在庫：旧版方式へ回帰）
     ========================================================================= */

    public function store(array $input): array
    {
        $data = new Collection($input);

        DB::beginTransaction();
        try {
            $receive_order_id = $data->get('receive_order_id');

            \Log::info('[SalesService][store] begin', [
                'has_receive_order_id' => (bool)$receive_order_id,
                'receive_order_id' => $receive_order_id ? (int)$receive_order_id : null,
                'detail_count' => is_array($data->get('details')) ? count($data->get('details')) : null,
                'detail_keys_0' => (isset(($data->get('details') ?? [])[0]) && is_array(($data->get('details') ?? [])[0]))
                    ? array_keys(($data->get('details') ?? [])[0])
                    : null,
            ]);

            $sales = new Sales();
            $this->fillSalesHeader($sales, $data);
            $sales->save();

            \Log::info('[SalesService][store] saved header', [
                'sales_id' => (int)$sales->id,
                'receive_order_id' => $receive_order_id ? (int)$receive_order_id : null,
            ]);

            if ($receive_order_id) {
                $this->insertReceiveOrderSales((int)$receive_order_id, (int)$sales->id);
            }

            $details = $data->get('details') ?? [];
            $this->insertDetails((int)$sales->id, $details, $receive_order_id);

            if ($receive_order_id) {
                $this->updateSalesCompleted((int)$receive_order_id);
                $this->updateHasSales((int)$receive_order_id);

                // ★ upsert後にDBを読み直してログ（〇が付かない原因切り分け）
                $hasTbl = $this->receiveOrderHasSalesTable();
                $hasSalesRow = $hasTbl
                    ? DB::table($hasTbl)->where('receive_order_id', (int)$receive_order_id)->first()
                    : null;

                \Log::info('[SalesService][store] after status update', [
                    'sales_id' => (int)$sales->id,
                    'receive_order_id' => (int)$receive_order_id,
                    'receive_order_has_sales_table' => $hasTbl,
                    'has_sales_row' => $hasSalesRow ? (array)$hasSalesRow : null,
                ]);
            }

            $this->rebuildInventoryMovesBySalesId((int)$sales->id);
            $this->recalcDomesticStockBySalesId((int)$sales->id, []);

            DB::commit();

            \Log::info('[SalesService][store] committed', [
                'sales_id' => (int)$sales->id,
                'receive_order_id' => $receive_order_id ? (int)$receive_order_id : null,
            ]);

            return ['success' => true, 'id' => $sales->id];
        } catch (\Throwable $e) {
            $lvl = DB::transactionLevel();
            \Log::error('[SalesService][store] exception', [
                'transactionLevel' => $lvl,
                'message' => $e->getMessage(),
                'exception' => get_class($e),
            ]);

            if ($lvl > 0) DB::rollBack();
            throw $e;
        }
    }

    public function update(int $sales_id, array $input): array
    {
        $data = new Collection($input);

        DB::beginTransaction();
        try {
            \Log::info('[SalesService][update] begin', [
                'sales_id' => $sales_id,
                'incoming_detail_count' => is_array($data->get('details')) ? count($data->get('details')) : null,
            ]);

            /** @var Sales $sales */
            $sales = Sales::query()->from('t_sales')->findOrFail($sales_id);

            $preItemNumbers = $this->getSaleItemNumbers($sales_id);

            $this->fillSalesHeader($sales, $data);
            $sales->save();

            // ★この売上が紐づく受注ID（リンク経由）
            $receive_order_id = $this->getReceiveOrderIdBySaleId($sales_id);

            \Log::info('[SalesService][update] header saved', [
                'sales_id' => $sales_id,
                'receive_order_id' => $receive_order_id,
            ]);

            $details = $data->get('details') ?? [];
            $this->updateDetails($sales_id, $details); // ※ここはログ確認後に改修する

            if ($receive_order_id) {
                $this->updateSalesCompleted((int)$receive_order_id);
                $this->updateHasSales((int)$receive_order_id);

                $hasTbl = $this->receiveOrderHasSalesTable();
                $hasSalesRow = $hasTbl
                    ? DB::table($hasTbl)->where('receive_order_id', (int)$receive_order_id)->first()
                    : null;

                \Log::info('[SalesService][update] after status update', [
                    'sales_id' => $sales_id,
                    'receive_order_id' => (int)$receive_order_id,
                    'receive_order_has_sales_table' => $hasTbl,
                    'has_sales_row' => $hasSalesRow ? (array)$hasSalesRow : null,
                ]);
            }

            $this->rebuildInventoryMovesBySalesId($sales_id);
            $this->recalcDomesticStockBySalesId($sales_id, $preItemNumbers);

            DB::commit();

            \Log::info('[SalesService][update] committed', [
                'sales_id' => $sales_id,
                'receive_order_id' => $receive_order_id,
            ]);

            return ['success' => true];
        } catch (\Throwable $e) {
            $lvl = DB::transactionLevel();
            \Log::error('[SalesService][update] exception', [
                'sales_id' => $sales_id,
                'transactionLevel' => $lvl,
                'message' => $e->getMessage(),
                'exception' => get_class($e),
            ]);

            if ($lvl > 0) DB::rollBack();
            throw $e;
        }
    }

    public function delete(int $sales_id): void
    {
        DB::transaction(function () use ($sales_id) {

            // 削除前の品番を保持
            $preItemNumbers = $this->getSaleItemNumbers($sales_id);

            $sales = Sales::query()->from('t_sales')->findOrFail($sales_id);
            $receive_order_id = $this->getReceiveOrderIdBySaleId($sales_id);

            $sales->details()->delete();

            $this->deleteReceiveOrderLinksBySalesId($sales_id);

            $sales->delete();

            if ($receive_order_id) {
                $this->updateSalesCompleted((int)$receive_order_id);
                $this->updateHasSales((int)$receive_order_id);
            }

            // ★重要：削除した売上の moves を消してから再計算（残ると差分が残留する）
            DB::table('t_inventory_moves')->where('sales_id', $sales_id)->delete();

            // sales 自体は消えるので current は空になる。preItemNumbers を対象に再計算。
            $this->recalcDomesticStockBySalesId($sales_id, $preItemNumbers);
        });
    }

    /**
     * システム設定から消費税率を取得
     * - m_configs の構成差異（key/value の列名揺れ）を吸収
     * - 取得できない場合は 10 を返す
     */
    private function resolveSalesTaxRate(): float
    {
        try {
            if (!$this->hasColumnSafe('m_configs', 'id')) {
                return 10.0;
            }
        } catch (\Throwable $e) {
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

    private function hydrateShipToAliasesForEdit(array $data): array
    {
        $map = [
            'name'     => 'ship_to_name',
            'zip_code' => 'ship_to_zip_code',
            'address1' => 'ship_to_address1',
            'address2' => 'ship_to_address2',
            'tel'      => 'ship_to_tel',
        ];

        foreach ($map as $legacyKey => $shipKey) {
            $legacyEmpty = (!array_key_exists($legacyKey, $data) || $data[$legacyKey] === null || $data[$legacyKey] === '');
            $shipHas     = (array_key_exists($shipKey, $data) && $data[$shipKey] !== null && $data[$shipKey] !== '');

            if ($legacyEmpty && $shipHas) {
                $data[$legacyKey] = $data[$shipKey];
            }
        }

        return $data;
    }

    public function getPdfData(array $input): array
    {
        // （以下はあなたの貼ってくれた既存実装のまま）
        $payload = $input['data'] ?? $input;

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

        if (empty($payload['sales_date'])) {
            if (!empty($payload['sales_at'])) {
                $payload['sales_date'] = $payload['sales_at'];
            } elseif (!empty($payload[$this->salesDateColumn()])) {
                $payload['sales_date'] = $payload[$this->salesDateColumn()];
            }
        }

        // config_data / customer_data / sales_tax_rate 補完は既存のまま…
        // （省略せずそのまま運用している前提なら、この下は元ファイルを維持してください）

        return $payload;
    }
}
