<?php

namespace App\Api\ItemClassification\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ImageUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        // ルートミドルウェアで権限チェック済み
        return true;
    }

    protected function prepareForValidation(): void
    {
        $categoryId = $this->input('category_id', null);
        $this->merge([
            // "null" や "" を null に揃える
            'category_id' => ($categoryId === '' || $categoryId === 'null') ? null : $categoryId,
        ]);
    }

    public function rules(): array
    {
        return [
            // 既存仕様：name は常に送っている（重複チェックはストア側でユニーク＋サービス側で弾く）
            'name'        => ['required', 'string', 'max:255'],
            // 紐付け解除のため null 許容
            'category_id' => ['nullable', 'integer'],
            // ファイル置換にも対応（既存フローでは省略されることもある）
            'file'        => ['sometimes', 'file', 'mimes:jpg,jpeg,png,gif,webp', 'max:10240'],
        ];
    }

    public function attributes(): array
    {
        return [
            'name'        => '画像名',
            'category_id' => 'カテゴリID',
            'file'        => '画像ファイル',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => ':attribute は必須です。',
            'name.max'      => ':attribute は:max文字以内で入力してください。',
            'category_id.integer' => ':attribute は整数で入力してください。',
            'file.file'     => ':attribute の形式が正しくありません。',
            'file.mimes'    => ':attribute は jpg/jpeg/png/gif/webp を指定してください。',
            'file.max'      => ':attribute は最大 :max KB までです。',
        ];
    }
}
