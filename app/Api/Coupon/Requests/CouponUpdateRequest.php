<?php

namespace App\Api\Coupon\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Log;

class CouponUpdateRequest extends CouponRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        \Log::debug('🧪 CouponUpdateRequest::rules() 呼び出し');
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
            'rules.*.benefit_type' => ['required', 'in:discount,free_item,free_shipping,special_item'],
            'rules.*.benefit_value' => ['required'],
        ];

        $inputRules = $this->input('rules', []);
        foreach ($inputRules as $index => $rule) {
            $benefitType = $rule['benefit_type'] ?? null;
            $prefix = "rules.$index.benefit_value";

            if ($benefitType === 'discount') {
                $rules["$prefix.type"] = ['required', 'in:yen,percent'];
                $rules["$prefix.value"] = ['required', 'regex:/^\d+(\.\d+)?$/'];
            } elseif ($benefitType === 'free_item') {
                $rules["$prefix.value"] = ['required', 'string'];
            } elseif ($benefitType === 'free_shipping') {
                // 追加バリデーションなし
            } elseif ($benefitType === 'special_item') {
                $rules["$prefix.type"] = ['required', 'in:special_item'];
                $rules["$prefix.value"] = ['required', 'string'];
            }
        }

        return $rules;
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $rules = $this->input('rules', []);
            foreach ($rules as $i => $rule) {
                // ✅ condition_value の decode 処理を追加
                if (
                    isset($rule['condition_value']) &&
                    is_string($rule['condition_value']) &&
                    $this->isJsonArray($rule['condition_value'])
                ) {
                    $rules[$i]['condition_value'] = json_decode($rule['condition_value'], true);
                }

                // ✅ 配列バリデーション（再評価）
                if (
                    in_array($rule['condition_type'], ['category_id', 'item_id']) &&
                    !is_array($rules[$i]['condition_value'])
                ) {
                    Log::error('❌ condition_valueが配列ではない', ['index' => $i]);
                    $validator->errors()->add("rules.$i.condition_value", '値が配列である必要があります');
                }

                Log::debug("🔍 Rule #{$i}", [
                    'type'         => $rule['condition_type'] ?? '',
                    'value'        => $rule['condition_value'] ?? '',
                    'benefitType'  => $rule['benefit_type'] ?? '',
                    'benefitValue' => $rule['benefit_value'] ?? '',
                ]);
            }

            // 再セット（必要に応じて）
            $this->merge(['rules' => $rules]);
        });
    }

    // ✅ ヘルパー関数を追加
    private function isJsonArray(string $json): bool
    {
        $decoded = json_decode($json, true);
        return json_last_error() === JSON_ERROR_NONE && is_array($decoded);
    }
    }
