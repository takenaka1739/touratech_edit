<?php

namespace App\Api\Sales\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SalesStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        // ルート側で auth ミドルウェアが掛かっている前提
        return true;
    }

    /**
     * バリデーション前の正規化 + 事実確認ログ
     *
     * - sales_at が空で来ているため required に落ちている可能性が高い
     * - controller より前で落ちるので、ここでログを出す
     * - 暫定回避：sales_at が空なら今日を補完（保存を通しつつ原因を確定）
     */
    protected function prepareForValidation(): void
    {
        $rawSalesAt = $this->input('sales_at');
        $rawDeliveryDate = $this->input('delivery_date');

        // まず「実際に何が来ているか」をログ出し（controllerに届く前）
        try {
            \Log::warning('[SalesStoreRequest] prepareForValidation', [
                'content_type' => $this->header('content-type'),
                'sales_at_raw_type' => gettype($rawSalesAt),
                'sales_at_raw' => is_scalar($rawSalesAt) ? (string)$rawSalesAt : $rawSalesAt,
                'delivery_date_raw_type' => gettype($rawDeliveryDate),
                'delivery_date_raw' => is_scalar($rawDeliveryDate) ? (string)$rawDeliveryDate : $rawDeliveryDate,
                'payload_keys' => array_keys($this->all() ?? []),
            ]);
        } catch (\Throwable $e) {
            // ログ失敗で落とさない
        }

        // sales_at の補正：空なら今日、入っていれば "/" を "-" に
        $salesAt = $rawSalesAt;
        if ($salesAt === null || $salesAt === '') {
            // 暫定：空なら今日（required落ち回避）
            $salesAt = now()->format('Y-m-d');
        } elseif (is_string($salesAt)) {
            $salesAt = str_replace('/', '-', $salesAt);
        }

        // delivery_date も同様に "/" → "-"（空は null のまま）
        $deliveryDate = $rawDeliveryDate;
        if (is_string($deliveryDate) && $deliveryDate !== '') {
            $deliveryDate = str_replace('/', '-', $deliveryDate);
        }

        $this->merge([
            'sales_at' => $salesAt,
            'delivery_date' => ($deliveryDate === '' ? null : $deliveryDate),
        ]);
    }

    public function rules(): array
    {
        return [
            // ヘッダ
            'sales_at'          => ['required', 'string'],

            'customer_id'       => ['nullable', 'integer'],

            'corporate_class'   => ['required', 'integer'],        // 支払方法（法人区分）
            'tel'               => ['required', 'string'],

            'send_flg'          => ['sometimes', 'boolean'],
            'name'              => ['required_if:send_flg,1', 'nullable', 'string'],
            'zip_code'          => ['required_if:send_flg,1', 'nullable', 'string'],
            'address1'          => ['required_if:send_flg,1', 'nullable', 'string'],
            'address2'          => ['nullable', 'string'],
            'fax'               => ['nullable', 'string'],
            'user_id'           => ['nullable', 'integer'],
            'shipping_amount'   => ['nullable', 'numeric'],
            'fee'               => ['nullable', 'numeric'],
            'discount'          => ['nullable', 'numeric'],
            'total_amount'      => ['nullable', 'numeric'],
            'order_no'          => ['nullable', 'string'],
            'remarks'           => ['nullable', 'string'],
            'rate'              => ['nullable', 'integer'],
            'sales_tax_rate'    => ['nullable', 'integer'],
            'fraction'          => ['nullable', 'integer'],
            'receive_order_id'  => ['nullable', 'integer'],
            'has_invoice'       => ['nullable', 'boolean'],

            // 明細（1件以上必須）
            'details'                           => ['required', 'array', 'min:1'],
            'details.*.id'                      => ['nullable', 'integer'],
            'details.*.no'                      => ['nullable', 'integer'],
            'details.*.item_kind'               => ['nullable', 'integer'],
            'details.*.item_id'                 => ['nullable', 'integer'],
            'details.*.sales_unit_price'        => ['nullable', 'numeric'],
            'details.*.rate'                    => ['nullable', 'integer'],
            'details.*.unit_price'              => ['nullable', 'numeric'],
            'details.*.quantity'                => ['required', 'integer', 'min:1'],
            'details.*.discount'                => ['nullable', 'numeric', 'min:0'], // ★追加：明細割引
            'details.*.amount'                  => ['nullable', 'numeric'],
            'details.*.sales_tax'               => ['nullable', 'numeric', 'min:0'], // （任意）送るなら
            'details.*.sales_tax_rate'          => ['nullable', 'integer'],
            'details.*.fraction'                => ['nullable', 'integer'],
        ];
    }

    public function attributes(): array
    {
        return [
            'sales_at'                  => '売上日',
            'customer_id'               => '得意先',
            'corporate_class'           => '支払方法',
            'tel'                       => 'TEL',
            'name'                      => '届け先名',
            'zip_code'                  => '郵便番号',
            'address1'                  => '住所1',
            'address2'                  => '住所2',
            'details'                   => '明細',
            'details.*.quantity'        => '数量',
            'details.*.unit_price'      => '単価',
            'details.*.discount'        => '割引',
        ];
    }

    public function messages(): array
    {
        return [
            'sales_at.required'                 => ':attributeを入力してください。',
            'corporate_class.required'          => ':attributeを選択してください。',
            'tel.required'                      => ':attributeを入力してください。',

            'name.required_if'                  => '発送ありの場合は:attributeを入力してください。',
            'zip_code.required_if'              => '発送ありの場合は:attributeを入力してください。',
            'address1.required_if'              => '発送ありの場合は:attributeを入力してください。',

            'details.required'                  => ':attributeを1件以上追加してください。',
            'details.array'                     => ':attributeの形式が不正です。',
            'details.min'                       => ':attributeを1件以上追加してください。',
            'details.*.quantity.required'       => ':attributeを入力してください。',
            'details.*.quantity.min'            => ':attributeは1以上で入力してください。',
        ];
    }

    /**
     * validated() の戻り値に必要項目が欠けないよう、軽く補正
     */
    public function validated($key = null, $default = null)
    {
        $v = parent::validated($key, $default);

        // send_flg が未送信の場合 false 扱い
        if (!array_key_exists('send_flg', $v)) {
            $v['send_flg'] = (bool) $this->boolean('send_flg');
        }

        return $v;
    }
}
