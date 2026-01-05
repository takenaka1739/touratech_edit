<?php

namespace App\Api\Sales\Services\Concerns;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

trait SalesDetailHydrator
{
    private function hydrateCustomerFieldsForEdit(array $data): array
    {
        $customerId = (int)($data['customer_id'] ?? 0);
        if ($customerId <= 0) return $data;

        // ★ corporate_class は補完対象から外す
        $targets = ['zip_code', 'address1', 'address2', 'fax', 'tel'];

        $needs = false;
        foreach ($targets as $k) {
            if (!array_key_exists($k, $data) || $data[$k] === null || $data[$k] === '') {
                $needs = true;
                break;
            }
        }
        if (!$needs) return $data;

        $ct = $this->resolveCustomerTable();
        if (!$ct) return $data;

        // customer テーブルから取得できる列だけ select
        $cols = ['id'];
        foreach ([
            'name', 'zip_code', 'tel', 'fax',
            'address1', 'address2', 'prefectures', 'municipality', 'number',
            // corporate_class は「得意先選択時のみ」使うので、ここでは必須ではない（残してもOK）
            'corporate_class',
        ] as $c) {
            if ($this->hasColumnSafe($ct, $c)) $cols[] = $c;
        }

        $c = DB::table($ct)->select($cols)->where('id', $customerId)->first();
        if (!$c) return $data;

        // customer_name 補完（保険）
        if (($data['customer_name'] ?? '') === '' && property_exists($c, 'name') && $c->name !== null) {
            $data['customer_name'] = (string)$c->name;
        }

        // ★ corporate_class は補完しない
        foreach (['zip_code', 'tel', 'fax'] as $k) {
            if (
                (!array_key_exists($k, $data) || $data[$k] === null || $data[$k] === '')
                && property_exists($c, $k)
                && $c->{$k} !== null
                && $c->{$k} !== ''
            ) {
                $data[$k] = $c->{$k};
            }
        }

        // 住所補完（prefectures+municipality → address1 / number → address2）
        $salesAddr1Empty = (!array_key_exists('address1', $data) || $data['address1'] === null || $data['address1'] === '');
        $salesAddr2Empty = (!array_key_exists('address2', $data) || $data['address2'] === null || $data['address2'] === '');

        if ($salesAddr1Empty) {
            if (property_exists($c, 'address1') && $c->address1 !== null && $c->address1 !== '') {
                $data['address1'] = $c->address1;
            } else {
                $pref = property_exists($c, 'prefectures') ? (string)($c->prefectures ?? '') : '';
                $muni = property_exists($c, 'municipality') ? (string)($c->municipality ?? '') : '';
                $addr1 = trim($pref . $muni);
                if ($addr1 !== '') $data['address1'] = $addr1;
            }
        }

        if ($salesAddr2Empty) {
            if (property_exists($c, 'address2') && $c->address2 !== null && $c->address2 !== '') {
                $data['address2'] = $c->address2;
            } else {
                $num = property_exists($c, 'number') ? (string)($c->number ?? '') : '';
                if ($num !== '') $data['address2'] = $num;
            }
        }

        return $data;
    }

    private function getDetails(int $sales_id): array
    {
        $detailTable = $this->salesDetailTable(); // 例: t_sale_details
        $itemTable   = 'm_items';

        $q = DB::table("{$detailTable} as d")
            ->where('d.sale_id', $sales_id)
            ->whereIn('d.item_kind', [1, 2]) // 旧版対象
            ->orderBy('d.sale_id')
            ->orderBy('d.no');

        $hasItems = Schema::hasTable($itemTable);
        if ($hasItems) {
            $q->leftJoin("{$itemTable} as i", 'i.id', '=', 'd.item_id');
        }

        $select = [
            'd.*',
        ];

        // -----------------------------
        // 品番：d.item_number が NULL/空なら i.item_number（or i.code）を採用
        // -----------------------------
        if ($hasItems) {
            $itemNumberCol = null;
            if ($this->hasColumnSafe($itemTable, 'item_number')) {
                $itemNumberCol = 'i.item_number';
            } elseif ($this->hasColumnSafe($itemTable, 'code')) {
                // プロジェクトによって品番が code の場合があるため保険
                $itemNumberCol = 'i.code';
            }

            if ($itemNumberCol) {
                if ($this->hasColumnSafe($detailTable, 'item_number')) {
                    // d側カラムがあっても NULL なら m_items を使う
                    $select[] = DB::raw("COALESCE(NULLIF(d.item_number,''), {$itemNumberCol}) as item_number");
                } else {
                    $select[] = DB::raw("{$itemNumberCol} as item_number");
                }
            } else {
                $select[] = DB::raw("NULL as item_number");
            }
        } else {
            // m_items が無い環境の保険
            $select[] = DB::raw($this->hasColumnSafe($detailTable, 'item_number') ? "d.item_number as item_number" : "NULL as item_number");
        }

        // -----------------------------
        // 品名：d.item_name が NULL/空なら i.name を採用
        // -----------------------------
        if ($hasItems && $this->hasColumnSafe($itemTable, 'name')) {
            if ($this->hasColumnSafe($detailTable, 'item_name')) {
                $select[] = DB::raw("COALESCE(NULLIF(d.item_name,''), i.name) as item_name");
            } else {
                $select[] = DB::raw("i.name as item_name");
            }
        } else {
            $select[] = DB::raw($this->hasColumnSafe($detailTable, 'item_name') ? "d.item_name as item_name" : "NULL as item_name");
        }

        // -----------------------------
        // (任意) 日本語名：d.item_name_jp が NULL/空なら i.name_jp / i.name_ja を採用
        // ※ PDF側は item_name_jp が空なら item_name を使うので、無くても致命ではない
        // -----------------------------
        if ($hasItems) {
            $jpCol = null;
            if ($this->hasColumnSafe($itemTable, 'name_jp')) {
                $jpCol = 'i.name_jp';
            } elseif ($this->hasColumnSafe($itemTable, 'name_ja')) {
                $jpCol = 'i.name_ja';
            }

            if ($jpCol) {
                if ($this->hasColumnSafe($detailTable, 'item_name_jp')) {
                    $select[] = DB::raw("COALESCE(NULLIF(d.item_name_jp,''), {$jpCol}) as item_name_jp");
                } else {
                    $select[] = DB::raw("{$jpCol} as item_name_jp");
                }
            } else {
                $select[] = DB::raw("NULL as item_name_jp");
            }
        } else {
            $select[] = DB::raw($this->hasColumnSafe($detailTable, 'item_name_jp') ? "d.item_name_jp as item_name_jp" : "NULL as item_name_jp");
        }

        // ★重要：stdClass を混ぜない（PDF側での扱いブレ防止）
        return $q->select($select)
            ->get()
            ->map(fn ($r) => (array)$r)
            ->toArray();
    }

    private function getDetailsByReceiveId(int $receive_order_id)
    {
        $rd = 't_receive_order_details';
        $mi = 'm_items';

        $stockCol = $this->itemStockColumn();

        // discount 列名揺れ対応（存在する列を discount として返す）
        $discountExpr = '0 as discount';
        foreach (['discount', 'detail_discount', 'discount_amount', 'discount_value'] as $col) {
            if ($this->hasColumnSafe($rd, $col)) {
                $discountExpr = "rd.{$col} as discount";
                break;
            }
        }

        $q = DB::table("{$rd} as rd")
            ->leftJoin("{$mi} as i", 'i.id', '=', 'rd.item_id')
            ->select([
                'rd.id as receive_order_detail_id',
                'rd.no',
                'rd.item_kind',
                'rd.item_id',
                'rd.item_number',
                'rd.item_name',
                'rd.item_name_jp',
                'rd.sales_unit_price',
                'rd.rate',
                'rd.fraction',
                'rd.unit_price',
                'rd.quantity',
                'rd.amount',
                'rd.sales_tax_rate',
                'rd.sales_tax',

                // ★追加：受注明細の割引
                DB::raw($discountExpr),

                DB::raw("i.{$stockCol} as domestic_stock"),
            ])
            ->where('rd.receive_order_id', $receive_order_id)
            ->whereIn('rd.item_kind', [1, 2]);

        if ($this->hasColumnSafe($rd, 'sales_completed')) {
            $q->where('rd.sales_completed', '<>', 1);
        }

        if ($this->hasColumnSafe($mi, $stockCol)) {
            $q->where("i.{$stockCol}", '<>', 0);
        }

        return $q->orderBy('rd.receive_order_id')->orderBy('rd.no')->get();
    }
}
