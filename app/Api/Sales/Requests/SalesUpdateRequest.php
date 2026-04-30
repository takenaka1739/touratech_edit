<?php

namespace App\Api\Sales\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class SalesUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * ★新規と同じ正規化
     * send_flg を 0/1 に統一して required_if を確実に効かせる
     */
    protected function prepareForValidation(): void
    {
        $rawSendFlg = $this->input('send_flg');

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
            // ===== 新規と同じ必須 =====
            'sales_at'        => ['required', 'string'],
            'corporate_class' => ['required', 'integer'],
            'tel'             => ['required', 'string'],

            'send_flg' => ['required', 'integer', 'in:0,1'],

            'name'     => ['required_if:send_flg,1', 'string'],
            'zip_code' => ['required_if:send_flg,1', 'string'],
            'address1' => ['required_if:send_flg,1', 'string'],
            'address2' => ['nullable', 'string'],

            // ===== それ以外は従来通り =====
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
            'has_invoice'      => ['nullable', 'boolean'],

            // 明細（更新でも必須）
            'details' => ['required', 'array', 'min:1'],
            'details.*.id'       => ['nullable', 'integer'],
            'details.*.no'       => ['nullable', 'integer'],
            'details.*.item_kind'=> ['required', 'integer'],
            'details.*.item_id'  => ['nullable', 'integer'], // item_kind に応じた必須は Service 側で弾いているのでここは nullable でOK
            'details.*.unit_price' => ['nullable', 'numeric'],
            'details.*.sales_unit_price' => ['nullable', 'numeric'],
            'details.*.rate'     => ['nullable', 'integer'],
            'details.*.fraction' => ['nullable', 'integer'],

            'details.*.quantity' => ['required', 'integer', 'min:1'],
            'details.*.discount' => ['nullable', 'numeric', 'min:0'],

            'details.*.item_number' => ['nullable', 'string'],
            'details.*.item_name'   => ['nullable', 'string'],
            'details.*.item_name_jp'=> ['nullable', 'string'],
            'details.*.parent_id'   => ['nullable', 'integer'],
            'details.*.receive_order_detail_id' => ['nullable', 'integer'],
            'details.*.sales_tax_rate' => ['nullable', 'numeric'],
            'details.*.sales_tax'      => ['nullable', 'numeric'],
            'details.*.amount'         => ['nullable', 'numeric'],
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
            'details.*.quantity' => '数量',
            'details.*.item_kind' => '種類',
            'details.*.item_id'   => '商品ID',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required_if'     => '発送ありの場合は:attributeを入力してください。',
            'zip_code.required_if' => '発送ありの場合は:attributeを入力してください。',
            'address1.required_if' => '発送ありの場合は:attributeを入力してください。',
            'details.required'     => ':attributeを1件以上追加してください。',
        ];
    }

    /**
     * ★Estimate と同じ挙動
     * validation エラーを 422 にせず、errors を返す
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
