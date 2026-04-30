<?php

namespace App\Api\Sales\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class SalesStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * 
     * send_flg を 0/1 に正規化して required_if を確実に効かせる
     */
    protected function prepareForValidation(): void
    {
        $rawSendFlg = $this->input('send_flg');

        // "1"/1/true → 1、それ以外 → 0
        $sendFlg = (int)(
            $rawSendFlg === 1 ||
            $rawSendFlg === '1' ||
            $rawSendFlg === true
        );

        $salesAt = $this->input('sales_at');
        if (is_string($salesAt)) {
            $salesAt = str_replace('/', '-', $salesAt);
        }

        $deliveryDate = $this->input('delivery_date');
        if (is_string($deliveryDate)) {
            $deliveryDate = str_replace('/', '-', $deliveryDate);
        }

        $this->merge([
            'send_flg' => $sendFlg,
            'sales_at' => $salesAt,
            'delivery_date' => $deliveryDate ?: null,
        ]);
    }

    public function rules(): array
    {
        return [
            'sales_at'        => ['required', 'string'],
            'corporate_class' => ['required', 'integer'],
            'tel'             => ['required', 'string'],
            'send_flg' => ['required', 'integer', 'in:0,1'],
            'name'      => ['required_if:send_flg,1', 'string'],
            'zip_code'  => ['required_if:send_flg,1', 'string'],
            'address1'  => ['required_if:send_flg,1', 'string'],
            'address2'  => ['nullable', 'string'],

            'customer_id'      => ['nullable', 'integer'],
            'user_id'          => ['nullable', 'integer'],
            'shipping_amount'  => ['nullable', 'numeric'],
            'additional_shipping_amount' => ['nullable', 'numeric'],
            'fee'              => ['nullable', 'numeric'],
            'discount'         => ['nullable', 'numeric'],
            'total_amount'     => ['nullable', 'numeric'],
            'order_no'         => ['nullable', 'string'],
            'remarks'          => ['nullable', 'string'],
            'rate'             => ['nullable', 'integer'],
            'sales_tax_rate'   => ['nullable', 'integer'],
            'fraction'         => ['nullable', 'integer'],
            'receive_order_id' => ['nullable', 'integer'],

            // ===== 明細は必須 =====
            'details'                    => ['required', 'array', 'min:1'],
            'details.*.no'               => ['required', 'integer', 'min:1'],
            'details.*.item_kind'        => ['required', 'integer'],
            'details.*.item_id'          => ['required', 'integer', 'min:1'],
            'details.*.unit_price'       => ['required', 'numeric'],
            'details.*.quantity'         => ['required', 'integer', 'min:1'],
            'details.*.discount'         => ['nullable', 'numeric', 'min:0'],
            'details.*.receive_order_detail_id' => ['nullable', 'integer'],
            'details.*.amount'         => ['nullable', 'numeric'],
            'details.*.sales_tax'      => ['nullable', 'numeric'],
            'details.*.sales_tax_rate' => ['nullable', 'integer'],
            'details.*.fraction'       => ['nullable', 'integer'],
            'details.*.rate'           => ['nullable', 'integer'],
        ];
    }

    public function attributes(): array
    {
        return [
            'sales_at'   => '売上日',
            'corporate_class' => '支払方法',
            'tel'        => 'TEL',
            'name'       => '届け先名',
            'zip_code'   => '郵便番号',
            'address1'   => '住所1',
            'details'    => '明細',
            'details.*.no' => '明細行',
            'details.*.item_id' => '商品',
            'details.*.unit_price' => '単価',
            'details.*.quantity' => '数量',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required_if'     => '発送ありの場合は:attributeを入力してください。',
            'zip_code.required_if' => '発送ありの場合は:attributeを入力してください。',
            'address1.required_if' => '発送ありの場合は:attributeを入力してください。',
            'details.required'     => ':attributeを1件以上追加してください。',
            'details.*.item_id.required' => ':attributeが未設定の明細があります。',
            'details.*.item_id.min' => ':attributeが未設定（0）の明細があります。',
        ];
    }

    /**
     * success=false + errors を返す
     */
    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(
            response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 200)
        );
    }
}
