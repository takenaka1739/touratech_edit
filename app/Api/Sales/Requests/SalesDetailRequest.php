<?php

namespace App\Api\Sales\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * SalesDetailRequest
 * - 明細ダイアログのバリデーション（軽量）
 * - 元コントローラーの `detail(SalesDetailRequest $request)` に合わせる
 * - 「とりあえずOK判定にしたい」ケースが多いため、全体は緩めにしつつ
 *   送られてきた場合のみ型・最小値をチェックする。
 */
class SalesDetailRequest extends FormRequest
{
    public function authorize(): bool
    {
        // ルート側で auth ミドルウェアが掛かっている前提
        return true;
    }

    public function rules(): array
    {
        return [
            // ヘッダ（任意送信）
            'sales_at'          => ['sometimes', 'string'],
            'customer_id'       => ['sometimes', 'integer'],
            'corporate_class'   => ['sometimes', 'integer'],
            'send_flg'          => ['sometimes', 'boolean'],
            'name'              => ['sometimes', 'nullable', 'string'],
            'zip_code'          => ['sometimes', 'nullable', 'string'],
            'address1'          => ['sometimes', 'nullable', 'string'],
            'address2'          => ['sometimes', 'nullable', 'string'],
            'tel'               => ['sometimes', 'nullable', 'string'],
            'fax'               => ['sometimes', 'nullable', 'string'],
            'user_id'           => ['sometimes', 'integer'],
            'shipping_amount'   => ['sometimes', 'numeric'],
            'fee'               => ['sometimes', 'numeric'],
            'discount'          => ['sometimes', 'numeric'],
            'total_amount'      => ['sometimes', 'numeric'],
            'order_no'          => ['sometimes', 'nullable', 'string'],
            'remarks'           => ['sometimes', 'nullable', 'string'],
            'rate'              => ['sometimes', 'integer'],
            'sales_tax_rate'    => ['sometimes', 'integer'],
            'fraction'          => ['sometimes', 'integer'],

            // 明細（配列なら要素チェック。必須ではない）
            'details'                           => ['sometimes', 'array'],
            'details.*.no'                      => ['sometimes', 'integer', 'min:1'],
            'details.*.item_kind'               => ['sometimes', 'integer'],
            'details.*.item_id'                 => ['sometimes', 'integer'],
            'details.*.sales_unit_price'        => ['sometimes', 'numeric'],
            'details.*.rate'                    => ['sometimes', 'integer'],
            'details.*.unit_price'              => ['sometimes', 'numeric'],
            'details.*.quantity'                => ['sometimes', 'integer', 'min:1'],
            'details.*.amount'                  => ['sometimes', 'numeric'],
            'details.*.sales_tax_rate'          => ['sometimes', 'integer'],
            'details.*.fraction'                => ['sometimes', 'integer'],
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
            'details.*.amount'          => '金額',
        ];
    }

    public function messages(): array
    {
        return [
            'details.array'                 => ':attributeの形式が不正です。',
            'details.*.no.min'              => ':attributeは1以上で入力してください。',
            'details.*.quantity.min'        => ':attributeは1以上で入力してください。',
        ];
    }
}
