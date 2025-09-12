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
        $id = $this->route('id'); // ルートパラメータ名が id 前提（/.../{id}）

        // code は未入力OK（サービス側で自動採番する運用も許容）
        $codeRule = [
            'nullable',
            'string',
            'max:255',
            Rule::unique('m_categories', 'code')
                ->ignore($id)                 // 更新時は自分を無視
                ->whereNull('deleted_at'),    // ソフトデリート無視
        ];

        return [
            'name'        => ['required', 'string', 'max:255'],
            'is_display'  => ['required', 'boolean'],
            'code'        => $codeRule,
            // 親子関係の厳密チェックは後回しにするので exists は一旦外す
            'parent_code' => ['nullable', 'string', 'max:255'],
            'sort_order'  => ['nullable', 'integer', 'min:0'],
            'remarks'     => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * 事前整形：空文字→null、数値/真偽値の整形
     */
    protected function prepareForValidation(): void
    {
        $input = $this->all();

        foreach (['code', 'parent_code', 'remarks'] as $k) {
            if (array_key_exists($k, $input) && $input[$k] === '') {
                $input[$k] = null;
            }
        }

        if (array_key_exists('sort_order', $input) && $input['sort_order'] !== null && $input['sort_order'] !== '') {
            $input['sort_order'] = (int) $input['sort_order'];
        }

        if (array_key_exists('is_display', $input)) {
            // '0'/'1' や 'true'/'false' を boolean に寄せる
            $val = $input['is_display'];
            $input['is_display'] = filter_var($val, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($input['is_display'] === null) {
                // 数値/文字列の '0'/'1' を最後に判定
                $input['is_display'] = (string)$val === '1';
            }
        }

        $this->replace($input);
    }

    public function attributes(): array
    {
        return [
            'name'        => '商品分類名',
            'is_display'  => '表示フラグ',
            'code'        => '分類コード',
            'parent_code' => '親分類コード',
            'sort_order'  => '表示順',
            'remarks'     => '備考',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'   => ':attributeは必須です。',
            'is_display.*'    => ':attributeの形式が不正です。',
            'code.unique'     => ':attributeが既に使用されています。',
            'sort_order.*'    => ':attributeは0以上の整数で入力してください。',
        ];
    }
}
