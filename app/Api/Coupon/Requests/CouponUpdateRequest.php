<?php

namespace App\Api\Coupon\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Log;

class CouponUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'code' => ['required', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'details' => ['nullable', 'string'],
            'start_at' => ['required', 'date'],
            'end_at' => ['required', 'date', 'after_or_equal:start_at'],

            'rules' => ['nullable', 'array'],
            'rules.*.id' => ['nullable', 'integer'],
            'rules.*.condition_type' => ['required', 'string'],
            'rules.*.condition_value' => ['nullable'],
            'rules.*.price_operator' => ['nullable', 'in:gte,lte,eq'],
            'rules.*.benefit_type' => ['required', 'in:discount,free_item,free_shipping'],
            'rules.*.benefit_value' => ['required'],
        ];

        // 動的に benefit_type に応じたルールを追加
        $inputRules = $this->input('rules', []);
        foreach ($inputRules as $index => $rule) {
            $benefitType = $rule['benefit_type'] ?? null;
            $prefix = "rules.$index.benefit_value";

            if ($benefitType === 'discount') {
                $rules["$prefix.type"] = ['required', 'in:yen,percent'];
                $rules["$prefix.value"] = ['required', 'regex:/^\d+(\.\d+)?$/'];
            } elseif ($benefitType === 'free_item') {
                $rules["$prefix.description"] = ['required', 'string'];
            } elseif ($benefitType === 'free_shipping') {
                // 空オブジェクト {} の場合、追加バリデーションは不要
            }
        }

        return $rules;
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $rules = $this->input('rules', []);

            foreach ($rules as $index => $rule) {
                $type = $rule['condition_type'] ?? null;
                $value = $rule['condition_value'] ?? null;
                $benefitType = $rule['benefit_type'] ?? null;
                $benefitValue = $rule['benefit_value'] ?? null;

                // condition_value の型チェック
                if ($type === 'price' && !is_numeric($value)) {
                    $validator->errors()->add("rules.$index.condition_value", '価格条件の値は数値である必要があります。');
                }

                if ($type !== 'price' && $type !== 'all_items') {
                    if (!is_array($value)) {
                        $validator->errors()->add("rules.$index.condition_value", 'condition_value は配列である必要があります。');
                    }
                }

                if ($type === 'all_items' && !($value === 'All' || $value === [])) {
                    $validator->errors()->add("rules.$index.condition_value", '全商品指定の場合は "All" または空配列を指定してください。');
                }

                // benefit_value の型チェック
                if ($benefitType === 'free_item') {
                    if (!is_array($benefitValue) || !isset($benefitValue['description'])) {
                        $validator->errors()->add("rules.$index.benefit_value", '無料商品の特典値は {description: 内容} を含む必要があります。');
                    }
                }

                if ($benefitType === 'free_shipping') {
                    if (!is_array($benefitValue)) {
                        $validator->errors()->add("rules.$index.benefit_value", '送料無料の特典値は空のオブジェクト {} としてください。');
                    }
                }
            }
        });
    }
}
