<?php

namespace App\Api\Sales\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SalesListRequest extends FormRequest
{
    public function rules()
    {
        return [
            'c_sales_date_from' => ['nullable', 'date'],
            'c_sales_date_to' => ['nullable', 'date'],
            'c_customer_name' => ['nullable', 'string'],
            'c_user_name' => ['nullable', 'string'],
            'c_item_number' => ['nullable', 'string'],
            'c_name' => ['nullable', 'string'],
            'c_order_no' => ['nullable', 'string'],
            'page' => ['nullable', 'integer'],
            'per_page' => ['nullable', 'integer'],
        ];
    }

    public function authorize()
    {
        // 認可が必要な場合は適宜変更
        return true;
    }

    public function attributes()
    {
        return [
            'sales_date_from' => '売上日（開始）',
            'sales_date_to'   => '売上日（終了）',
            'customer_name'   => '得意先名',
            'personnel_name'  => '担当者名',
            'item_code'       => '品番',
            'item_name'       => '品名',
            'order_no'        => '注文番号',
        ];
    }
}
