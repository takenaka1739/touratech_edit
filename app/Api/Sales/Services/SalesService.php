<?php

namespace App\Api\Sales\Services;

use Illuminate\Support\Facades\Log;
use App\Base\Models\Sales;
use App\Base\Models\DeliveryAddress;
use App\Base\Models\Customer;

class SalesService
{
    public function getEditData($id): ?array
    {
        $sales = Sales::with(['details.item', 'customer', 'personnel', 'payment'])->find($id);

        if (!$sales) {
            return null;
        }

        $detailsAmount = collect($sales->details)->sum('amount');

        // ✅ 配送先データ取得
        $deliveryData = null;
        if ($sales->delivery_id) {
            $delivery = DeliveryAddress::find($sales->delivery_id);
            if ($delivery) {
                $deliveryData = [
                    'recipient_name' => $delivery->recipient_name,
                    'zip_code' => $delivery->zip_code,
                    'prefectures' => $delivery->prefectures,
                    'municipality' => $delivery->municipality,
                    'number' => $delivery->number,
                    'tel' => $delivery->tel,
                ];
            }
        }

        // ✅ 掛率取得
        $rate = optional($sales->customer)->rate;

        // ✅ 明細に掛率・商品情報を注入
        $details = collect($sales->details)->map(function ($detail) use ($rate) {
            return [
                'id' => $detail->id,
                'item_id' => $detail->item_id,
                'item_kind' => $detail->item_kind,
                'item_number' => optional($detail->item)->code,
                'item_name' => optional($detail->item)->name,
                'item_name_jp' => optional($detail->item)->name_note,
                'sales_unit_price' => $detail->sales_unit_price,
                'rate' => $rate, // ← ここに customer の掛率を明示的に渡す
                'unit_price' => $detail->unit_price,
                'quantity' => $detail->quantity,
                'amount' => $detail->amount,
            ];
        });

        // ✅ 支払方法コードから corporate_class を決定
        $corporateClass = null;
        if ($sales->payment) {
            switch ($sales->payment->method_code) {
                case '1': $corporateClass = 1; break; // 現金
                case '2': $corporateClass = 2; break; // 掛売
                case '3': $corporateClass = 3; break; // 宅配代引
                case '4': $corporateClass = 4; break; // 銀行振込
                case '5': $corporateClass = 5; break; // クレジットカード
            }
        }

        return [
            'id' => $sales->id,
            'sales_at' => $sales->sales_at,
            'delivery_date' => $sales->delivery_date,
            'customer_id' => $sales->customer_id,
            'customer_name' => optional($sales->customer)->name,
            'send_flg' => (bool) $sales->send_flg,
            'name' => $sales->name,
            'zip_code' => $sales->zip_code,
            'address1' => $sales->address1,
            'address2' => $sales->address2,
            'tel' => $sales->tel,
            'fax' => $sales->fax,
            'corporate_class' => $corporateClass,
            'user_id' => $sales->personnel_id,
            'user_name' => optional($sales->personnel)->name,
            'shipping_amount' => $sales->shipping_amount,
            'fee' => $sales->fee,
            'discount' => $sales->discount,
            'total_amount' => $sales->total_amount,
            'order_no' => $sales->order_no,
            'remarks' => $sales->remarks,
            'rate' => $rate,
            'sales_tax_rate' => $sales->sales_tax_rate,
            'fraction' => $sales->fraction,
            'details' => $details,
            'details_amount' => $detailsAmount,
            'barcode' => null,
            'has_invoice' => $sales->has_invoice ?? false,
            'delivery' => $deliveryData,
            'send_flg' => $sales->is_send ?? false,
        ];
    }

    public function getInitialData(): Sales
    {
        return new Sales();
    }
}