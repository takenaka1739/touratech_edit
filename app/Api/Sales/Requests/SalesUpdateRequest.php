<?php

namespace App\Api\Sales\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * SalesUpdateRequest
 * - 元コントローラーの型宣言に合わせた最低限の FormRequest
 * - 納品書/請求書のPDF発行（output_delivery / output_invoice）で
 *   id もしくは data を受け取れるようにしておく。
 * - 更新系でも使われるため、主要フィールドは「nullable」で許容。
 */
class SalesUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        // ルート側で auth ミドルウェアが掛かっている前提
        return true;
    }

    public function rules(): array
    {
        return [
            // PDF発行用（どちらか片方が来れば十分）
            'id'                => ['nullable', 'integer'],
            'data'              => ['nullable', 'array'],

            // 更新時に送られうる主要フィールド（緩めに許容）
            'sales_at'          => ['nullable', 'string'],
            'delivery_date'     => ['nullable', 'string'],
            'customer_id'       => ['nullable', 'integer'],
            'send_flg'          => ['nullable', 'boolean'],
            'name'              => ['nullable', 'string'],
            'zip_code'          => ['nullable', 'string'],
            'address1'          => ['nullable', 'string'],
            'address2'          => ['nullable', 'string'],
            'tel'               => ['nullable', 'string'],
            'fax'               => ['nullable', 'string'],
            'corporate_class'   => ['nullable', 'integer'],
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

            // 明細
            'details'           => ['nullable', 'array'],
            'details.*.no'               => ['nullable', 'integer'],
            'details.*.item_kind'        => ['nullable', 'integer'],
            'details.*.item_id'          => ['nullable', 'integer'],
            'details.*.sales_unit_price' => ['nullable', 'numeric'],
            'details.*.rate'             => ['nullable', 'integer'],
            'details.*.unit_price'       => ['nullable', 'numeric'],
            'details.*.quantity'         => ['nullable', 'integer'],
            'details.*.amount'           => ['nullable', 'numeric'],
            'details.*.sales_tax_rate'   => ['nullable', 'integer'],
            'details.*.fraction'         => ['nullable', 'integer'],
        ];
    }

    /**
     * validated() の戻り値に id / data が必ず含まれるよう、必要なら補完。
     */
    public function validated($key = null, $default = null)
    {
        $v = parent::validated($key, $default);

        // id / data が rules にマッチしないと空配列になることを避けるため保険
        if (!array_key_exists('id', $v) && $this->has('id')) {
            $v['id'] = (int) $this->input('id');
        }
        if (!array_key_exists('data', $v) && $this->has('data')) {
            $v['data'] = $this->input('data');
        }

        return $v;
    }
}
