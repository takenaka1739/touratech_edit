<?php

namespace App\Api\ShippingRate\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

class ShippingRateUpdateRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'free_shipping_thresholds' => ['required', 'array'],
            'free_shipping_thresholds.send_personal' => ['nullable', 'numeric', 'min:0'],
            'free_shipping_thresholds.send_trader' => ['nullable', 'numeric', 'min:0'],

            'prefecture_rates' => ['required', 'array'],
            'prefecture_rates.*.id' => ['nullable', 'integer'],
            'prefecture_rates.*.prefecture' => ['required', 'string', 'max:20'],
            'prefecture_rates.*.amount' => ['required', 'numeric', 'min:0'],
            'prefecture_rates.*.sort_order' => ['required', 'integer', 'min:1'],

            'remote_island_rates' => ['nullable', 'array'],
            'remote_island_rates.*.id' => ['nullable', 'integer'],
            'remote_island_rates.*.prefecture' => ['nullable', 'string', 'max:20'],
            'remote_island_rates.*.municipality' => ['nullable', 'string', 'max:100'],
            'remote_island_rates.*.area_names' => ['nullable', 'string', 'max:2000'],
            'remote_island_rates.*.amount' => ['required', 'numeric', 'min:0'],
            'remote_island_rates.*.sort_order' => ['required', 'integer', 'min:1'],
        ];
    }

    public function attributes(): array
    {
        return [
            'free_shipping_thresholds.send_personal' => '送料無料判定金額（一般向け）',
            'free_shipping_thresholds.send_trader' => '送料無料判定金額（業者向け）',
            'prefecture_rates.*.prefecture' => '都道府県',
            'prefecture_rates.*.amount' => '都道府県送料',
            'remote_island_rates.*.prefecture' => '都道府県',
            'remote_island_rates.*.municipality' => '市区町村',
            'remote_island_rates.*.area_names' => '離島名・地域名',
            'remote_island_rates.*.amount' => '離島追加送料',
        ];
    }
}
