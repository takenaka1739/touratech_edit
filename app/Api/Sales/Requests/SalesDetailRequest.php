<?php
// 更新: app/Api/Sales/Requests/SalesDetailRequest.php

namespace App\Api\Sales\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SalesDetailRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * "send_flg" を boolean として扱えるように寄せる
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('send_flg')) {
            $this->merge([
                'send_flg' => filter_var($this->input('send_flg'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false,
            ]);
        }
    }

    public function rules(): array
    {
        return [
            // =========================
            // ヘッダ（保存時は必須寄せ）
            // =========================
            'sales_at'        => ['sometimes', 'string'],   // 日付型で厳密にするなら 'date' 等に変更
            'customer_id'     => ['sometimes', 'integer'],
            'corporate_class' => ['sometimes', 'integer'],  // 画面の「支払方法」に対応
            'send_flg'        => ['sometimes', 'boolean'],

            // 発送あり(send_flg=true) の場合に必須
            'name'            => ['sometimes,true', 'nullable', 'string'],
            'zip_code'        => ['sometimes,true', 'nullable', 'string'],
            'address1'        => ['sometimes,true', 'nullable', 'string'],
            'address2'        => ['sometimes', 'nullable', 'string'],
            'tel'             => ['sometimes,true', 'nullable', 'string'],
            'fax'             => ['sometimes', 'nullable', 'string'],

            'user_id'         => ['sometimes', 'integer'],
            'shipping_amount' => ['sometimes', 'numeric'],
            'fee'             => ['sometimes', 'numeric'],
            'discount'        => ['sometimes', 'numeric'],
            'total_amount'    => ['sometimes', 'numeric'],
            'order_no'        => ['sometimes', 'nullable', 'string'],
            'remarks'         => ['sometimes', 'nullable', 'string'],
            'rate'            => ['sometimes', 'integer'],
            'sales_tax_rate'  => ['sometimes', 'integer'],
            'fraction'        => ['sometimes', 'nullable', 'integer'],

            // =========================
            // 明細（保存時は最低1件）
            // =========================
            'details'                    => ['sometimes', 'array', 'min:1'],
            'details.*.no'               => ['sometimes', 'integer', 'min:1'],
            'details.*.item_kind'        => ['sometimes', 'integer'],
            'details.*.item_id'          => ['sometimes', 'integer'],

            // 数量/単価は保存時必須に寄せ（必要なければ sometimes に戻してください）
            'details.*.quantity'         => ['sometimes', 'integer', 'min:1'],
            'details.*.unit_price'       => ['sometimes', 'numeric'],
            'details.*.discount'         => ['sometimes', 'numeric', 'min:0'],

            'details.*.sales_unit_price' => ['sometimes', 'numeric'],
            'details.*.rate'             => ['sometimes', 'integer'],
            'details.*.amount'           => ['sometimes', 'numeric'],
            'details.*.sales_tax_rate'   => ['sometimes', 'integer'],
            'details.*.fraction'         => ['sometimes', 'nullable', 'integer'],
        ];
    }

    public function attributes(): array
    {
        return [
            'sales_at'             => '売上日',
            'customer_id'          => '得意先',
            'corporate_class'      => '支払方法',
            'tel'                  => 'TEL',
            'name'                 => '届け先名',
            'zip_code'             => '郵便番号',
            'address1'             => '住所1',
            'address2'             => '住所2',

            'details'              => '明細',
            'details.*.quantity'   => '数量',
            'details.*.unit_price' => '単価',
            'details.*.amount'     => '金額',
            'details.*.discount'   => '割引',
        ];
    }

    public function messages(): array
    {
        return [
            'sales_at.sometimes'            => ':attributeは必ず指定してください。',
            'customer_id.sometimes'         => ':attributeは必ず指定してください。',
            'corporate_class.sometimes'     => ':attributeは必ず指定してください。',

            'name.sometimes_if'             => '発送を指定した場合、:attributeは必ず指定してください。',
            'zip_code.sometimes_if'         => '発送を指定した場合、:attributeは必ず指定してください。',
            'address1.sometimes_if'         => '発送を指定した場合、:attributeは必ず指定してください。',
            'tel.sometimes_if'              => '発送を指定した場合、:attributeは必ず指定してください。',

            'details.sometimes'             => ':attributeは必ず指定してください。',
            'details.min'                  => ':attributeは必ず指定してください。',
            'details.array'                => ':attributeの形式が不正です。',
            'details.*.no.min'             => ':attributeは1以上で入力してください。',
            'details.*.quantity.sometimes'  => ':attributeは必ず指定してください。',
            'details.*.quantity.min'       => ':attributeは1以上で入力してください。',
            'details.*.unit_price.sometimes'=> ':attributeは必ず指定してください。',
        ];
    }
}
