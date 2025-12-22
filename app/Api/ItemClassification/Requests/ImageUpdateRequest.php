<?php

namespace App\Api\ItemClassification\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ImageUpdateRequest extends FormRequest
{
    use ImageRequestTrait;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $categoryId = $this->input('category_id', null);

        $this->merge([
            'category_id' => ($categoryId === '' || $categoryId === 'null') ? null : $categoryId,
        ]);
    }

    public function rules(): array
    {
        return array_merge(
            $this->commonRules(), // ✅ Trait の共通ルール（name max200 / file 10MB など）
            [
                // ✅ 更新時のみ：name の unique（自分自身は除外）
                'name' => [
                    'required',
                    'string',
                    'max:200',
                    Rule::unique('m_images', 'name')
                        ->whereNull('deleted_at')
                        ->ignore($this->route('id')),
                ],
            ]
        );
    }

    public function messages(): array
    {
        return [
            'name.required' => '画像名は必須です。',
            'name.max'      => '画像名は200文字以内で入力してください。',
            'name.unique'   => '同名の画像が既に存在します。別名にしてください。',

            'file.image'    => '画像ファイルを選択してください。',
            'file.mimes'    => 'アップロードできる拡張子は jpg, jpeg, png, gif, webp です。',
            'file.max'      => '画像サイズは10MB以下でアップロードしてください。',

            'category_id.integer' => 'カテゴリIDは整数で入力してください。',
            'item_id.integer'     => '商品IDは整数で入力してください。',
            'order_by.integer'    => '表示順は整数で入力してください。',
        ];
    }
}
