<?php

namespace App\Api\Sales\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * 売上出力用の取得サービス
 * - ship_to_* を最優先で使用
 * - 不足時は delivery → customer で補完
 * - send_flg / is_send 両対応
 * - 日付は 'YYYY-MM-DD' / 'YYYY/MM/DD' どちらでもOK
 */
class SalesOutputService
{
    public function getShippingRows(string $dateYmd)
    {
        $clean = str_replace('/', '-', trim($dateYmd));
        $from = Carbon::parse($clean)->startOfDay();
        $to   = Carbon::parse($clean)->copy()->addDay()->startOfDay();

        $salesTable   = 't_sales';
        $delivTable   = 'm_delivery_addresses';
        $customersTbl = null;

        if (!Schema::hasTable($salesTable)) {
            throw new \RuntimeException('t_sales テーブルが見つかりません。');
        }

        if (Schema::hasTable('t_customers'))      $customersTbl = 't_customers';
        elseif (Schema::hasTable('m_customers'))  $customersTbl = 'm_customers';
        elseif (Schema::hasTable('customers'))    $customersTbl = 'customers';

        $hasSendFlg = Schema::hasColumn($salesTable, 'send_flg');
        $hasIsSend  = Schema::hasColumn($salesTable, 'is_send');

        $hasShipToName = Schema::hasColumn($salesTable, 'ship_to_name');
        $hasShipToZip  = Schema::hasColumn($salesTable, 'ship_to_zip_code');
        $hasShipToA1   = Schema::hasColumn($salesTable, 'ship_to_address1');
        $hasShipToA2   = Schema::hasColumn($salesTable, 'ship_to_address2');
        $hasShipToTel  = Schema::hasColumn($salesTable, 'ship_to_tel');

        $hasDeliveryTable = Schema::hasTable($delivTable);

        $q = DB::table("$salesTable as s")
            ->where('s.sales_at', '>=', $from->format('Y-m-d H:i:s'))
            ->where('s.sales_at', '<',  $to->format('Y-m-d H:i:s'));

        if ($hasSendFlg)      $q->where('s.send_flg', 1);
        elseif ($hasIsSend)   $q->where('s.is_send', 1);

        if ($hasDeliveryTable) $q->leftJoin("$delivTable as d", 'd.id', '=', 's.delivery_id');
        if ($customersTbl && Schema::hasColumn($salesTable, 'customer_id')) {
            $q->leftJoin("$customersTbl as c", 'c.id', '=', 's.customer_id');
        }

        // 表示名は顧客名を優先（NULLなら delivery の recipient_name、さらに無ければ ship_to_name or 空）
        $selectName = DB::raw('COALESCE(c.name, '.($hasDeliveryTable ? 'd.recipient_name' : "NULL").', '.($hasShipToName ? 's.ship_to_name' : "''").') as name');

        // 住所は ship_to_* を最優先
        $selectZip = $hasShipToZip
            ? DB::raw('COALESCE(s.ship_to_zip_code, '.($hasDeliveryTable ? 'd.zip_code' : "NULL").') as zip_code')
            : DB::raw(($hasDeliveryTable ? 'COALESCE(d.zip_code, "")' : '""').' as zip_code');

        $selectAddr1 = $hasShipToA1
            ? DB::raw('COALESCE(s.ship_to_address1, '.($hasDeliveryTable ? 'CONCAT(COALESCE(d.prefectures,""), COALESCE(d.municipality,""))' : "NULL").') as address1')
            : DB::raw(($hasDeliveryTable ? 'CONCAT(COALESCE(d.prefectures,""), COALESCE(d.municipality,""))' : '""').' as address1');

        $selectAddr2 = $hasShipToA2
            ? DB::raw('COALESCE(s.ship_to_address2, '.($hasDeliveryTable ? 'd.number' : "NULL").') as address2')
            : DB::raw(($hasDeliveryTable ? 'COALESCE(d.number, "")' : '""').' as address2');

        $selectTel = $hasShipToTel
            ? DB::raw('COALESCE(s.ship_to_tel, '.($hasDeliveryTable ? 'd.tel' : "NULL").') as tel')
            : DB::raw(($hasDeliveryTable ? 'COALESCE(d.tel, "")' : '""').' as tel');

        // 支払方法（存在すれば）
        $selectCorp = Schema::hasColumn($salesTable, 'corporate_class')
            ? DB::raw('s.corporate_class')
            : DB::raw('NULL as corporate_class');

        return $q->select([
                's.id',
                's.customer_id',
                's.sales_at',
                $selectName,
                $selectZip,
                $selectAddr1,
                $selectAddr2,
                $selectTel,
                $selectCorp,
            ])
            ->orderBy('s.id', 'asc')
            ->get();
    }
}
