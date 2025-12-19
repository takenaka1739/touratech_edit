<?php

namespace App\Api\Coupon\Requests;

use Illuminate\Validation\Rule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Log;

class CouponStoreRequest extends CouponRequest
{
    /**
     * バリデーション失敗時のハンドリング
     */
    protected function failedValidation(Validator $validator)
    {
        Log::warning('【クーポン登録バリデーションエラー】', [
            'input'  => $this->all(),
            'errors' => $validator->errors()->toArray(),
        ]);

        // JSON で 422 を返す（必要に応じてフロント側でハンドリング）
        throw new HttpResponseException(
            response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422)
        );
    }

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code'     => ['required', 'string', 'max:255'],
            'name'     => ['required', 'string', 'max:255'],
            'details'  => ['nullable', 'string'],
            'start_at' => ['required', 'date'],
            'end_at'   => ['required', 'date', 'after_or_equal:start_at'],

            'rules'                      => ['required', 'array'],
            'rules.*.condition_type'     => ['required', 'string'],
            'rules.*.condition_value'    => ['nullable'],
            'rules.*.price_operator'     => ['nullable', 'in:gte,lte,eq'],
            //  benefit_type / benefit_value は 1 回だけ定義（discount / free_item / free_shipping / special_item を許可）
            'rules.*.benefit_type'       => ['required', 'in:discount,free_item,free_shipping,special_item'],
            'rules.*.benefit_value'      => ['required', 'array'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $rules = $this->input('rules', []);

            foreach ($rules as $index => $rule) {
                $type         = $rule['condition_type']  ?? null;
                $value        = $rule['condition_value'] ?? null;
                $benefitType  = $rule['benefit_type']    ?? null;
                $benefitValue = $rule['benefit_value']   ?? null;

                // ▼ 条件タイプに応じた検証 ▼
                if ($type === 'price') {
                    // 金額条件は数値であること
                    if (!is_numeric($value)) {
                        $validator->errors()->add("rules.$index.condition_value", '金額条件の値は数値である必要があります。');
                    }
                } elseif ($type === 'all_items') {
                    // 全商品指定
                    if (!($value === 'All' || $value === [] || is_null($value))) {
                        $validator->errors()->add("rules.$index.condition_value", '全商品指定の場合は "All" または空配列を指定してください。');
                    }
                } else {
                    // それ以外（item_id, category_id, brand_id 等）

                    //  item_id / category_id / brand_id は「単一ID でも配列でもOK」にする
                    if (in_array($type, ['item_id', 'category_id', 'brand_id'], true)) {
                        // 単一値（数値/文字列）は許可 → 後で配列に寄せるのでここではエラーにしない
                        if (!is_array($value) && !is_null($value) && !is_numeric($value) && !is_string($value)) {
                            $validator->errors()->add("rules.$index.condition_value", 'ID 条件の値はIDまたはIDの配列で指定してください。');
                        }
                    } else {
                        // その他のタイプは配列必須
                        if (!is_array($value)) {
                            $validator->errors()->add("rules.$index.condition_value", 'condition_value は配列である必要があります。');
                        }
                    }
                }

                // ▼ 特典内容 benefit_value の構造チェック ▼
                if ($benefitType === 'discount') {
                    if (
                        !is_array($benefitValue) ||
                        !in_array($benefitValue['type'] ?? '', ['yen', 'percent'], true) ||
                        !isset($benefitValue['value'])
                    ) {
                        $validator->errors()->add(
                            "rules.$index.benefit_value",
                            '割引の特典値は {type: yen|percent, value: 数値} 形式で指定してください。'
                        );
                    }
                }

                if ($benefitType === 'free_item') {
                    if (!is_array($benefitValue) || !isset($benefitValue['value'])) {
                        $validator->errors()->add(
                            "rules.$index.benefit_value",
                            '無料商品の特典値は {value: 内容} を含む必要があります。'
                        );
                    }
                }

                if ($benefitType === 'free_shipping') {
                    if (!is_array($benefitValue)) {
                        $validator->errors()->add(
                            "rules.$index.benefit_value",
                            '送料無料の特典値は空のオブジェクト {} としてください。'
                        );
                    }
                }

                // special_item追加
                if ($benefitType === 'special_item') {
                    if (
                        !is_array($benefitValue) ||
                        !isset($benefitValue['type']) ||
                        $benefitValue['type'] !== 'special_item' ||
                        !isset($benefitValue['value']) ||
                        !is_string($benefitValue['value'])
                    ) {
                        $validator->errors()->add(
                            "rules.$index.benefit_value",
                            '特別な商品の特典値は {type: special_item, value: 商品名文字列} 形式で指定してください。'
                        );
                    }
                }
            }
        });
    }

    public function validated($key = null, $default = null)
    {
        $validated = parent::validated($key, $default);

        foreach ($validated['rules'] ?? [] as $i => $rule) {

            //  ID 条件（item_id, category_id, brand_id）は単一値なら配列に寄せる
            if (isset($rule['condition_type']) &&
                in_array($rule['condition_type'], ['item_id', 'category_id', 'brand_id'], true)
            ) {
                if (isset($rule['condition_value']) &&
                    !is_array($rule['condition_value']) &&
                    !is_null($rule['condition_value'])
                ) {
                    $validated['rules'][$i]['condition_value'] = [$rule['condition_value']];
                }
            }

            // benefit_value / condition_value を JSON 文字列にしてサービス層へ渡す
            if (isset($rule['benefit_value']) && is_array($rule['benefit_value'])) {
                $validated['rules'][$i]['benefit_value'] = json_encode($rule['benefit_value']);
            }
            if (isset($rule['condition_value']) && is_array($rule['condition_value'])) {
                $validated['rules'][$i]['condition_value'] = json_encode($rule['condition_value']);
            }
        }

        return $validated;
    }
}
