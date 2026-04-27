<?php

namespace App\Api\ItemClassification\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ItemClassificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * POST(登録) / PUT|PATCH(更新) をこの1つでバリデーション
     */
    public function rules(): array
    {
        $id = $this->route('id');

        $codeRule = [
            'required',
            'string',
            'max:20',
            Rule::unique('m_categories', 'code')
                ->ignore($id)
                ->whereNull('deleted_at'),
        ];

        return [
            'is_display'  => ['required', 'boolean'],
            'name'        => ['required', 'string', 'max:100'],
            'code'        => $codeRule,
            'parent_code' => ['nullable', 'string', 'max:20'],
            'sort_order'  => ['nullable', 'integer', 'min:0'],
            'remarks'     => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * 事前整形：空文字→null、数値/真偽値の整形
     */
    protected function prepareForValidation(): void
    {
        $input = $this->all();

        foreach (['parent_code', 'remarks'] as $k) {
            if (array_key_exists($k, $input) && $input[$k] === '') {
                $input[$k] = null;
            }
        }

        if (array_key_exists('sort_order', $input) && $input['sort_order'] !== null && $input['sort_order'] !== '') {
            $input['sort_order'] = (int) $input['sort_order'];
        }

        if (array_key_exists('is_display', $input)) {
            $val = $input['is_display'];
            $input['is_display'] = filter_var($val, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

            if ($input['is_display'] === null) {
                $input['is_display'] = (string) $val === '1';
            }
        }

        $this->replace($input);
    }

    public function attributes(): array
    {
        return [
            'is_display'  => 'ショップへの公開',
            'name'        => '商品分類名',
            'code'        => '分類コード',
            'parent_code' => '親カテゴリ',
            'sort_order'  => '表示順',
            'remarks'     => '備考',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'   => ':attributeは必須です。',
            'name.max'        => ':attributeは100文字以内で入力してください。',
            'code.required'   => ':attributeは必須です。',
            'code.unique'     => ':attributeが既に使用されています。',
            'is_display.*'    => ':attributeの形式が不正です。',
            'sort_order.*'    => ':attributeは0以上の整数で入力してください。',
        ];
    }
}