<?php

namespace App\Api\Sales\Services;

use Illuminate\Support\Facades\Log;
use App\Base\Models\Sales;
use App\Base\Models\DeliveryAddress;

class SalesService
{
    public function getEditData($id): ?array
    {
        $sales = Sales::with(['details', 'customer', 'personnel', 'payment'])->find($id);

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

        // ✅ 支払方法コードから corporate_class を決定
       $corporateClass = null;
        if ($sales->payment) {
            switch ($sales->payment->method_code) {
                case '1': // 現金
                    $corporateClass = 1;
                    break;
                case '2': // 掛売
                    $corporateClass = 2;
                    break;
                case '3': // 宅配代引
                    $corporateClass = 3;
                    break;
                case '4': // 銀行振込
                    $corporateClass = 4;
                    break;
                case '5': // クレジットカード
                    $corporateClass = 5;
                    break;
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
            'corporate_class' => $corporateClass, // ← 修正済
            'user_id' => $sales->personnel_id,
            'user_name' => optional($sales->personnel)->name,
            'shipping_amount' => $sales->shipping_amount,
            'fee' => $sales->fee,
            'discount' => $sales->discount,
            'total_amount' => $sales->total_amount,
            'order_no' => $sales->order_no,
            'remarks' => $sales->remarks,
            'rate' => $sales->rate,
            'sales_tax_rate' => $sales->sales_tax_rate,
            'fraction' => $sales->fraction,
            'details' => $sales->details,
            'details_amount' => $detailsAmount,
            'barcode' => null,
            'has_invoice' => $sales->has_invoice ?? false,
            'delivery' => $deliveryData,
        ];
    }

    public function getInitialData(): Sales
    {
        return new Sales();
    }
}
