<?php

namespace App\Api\ItemClassification\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ImageStoreRequest extends FormRequest
{
    use ImageRequestTrait;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return array_merge(
            $this->commonRules(),
            [
                'name' => [
                    'required',
                    'string',
                    'max:200',
                ],
            ]
        );
    }

    public function messages(): array
    {
        return [
            'name.required' => '画像名は必須です。',
            'name.max'      => '画像名は200文字以内で入力してください。',

            'file.image'    => '画像ファイルを選択してください。',
            'file.mimes'    => 'アップロードできる拡張子は jpg, jpeg, png, gif, webp です。',
            'file.max'      => '画像サイズは10MB以下でアップロードしてください。',

            'category_id.integer' => 'カテゴリIDは整数で入力してください。',
            'item_id.integer'     => '商品IDは整数で入力してください。',
            'order_by.integer'    => '表示順は整数で入力してください。',
        ];
    }
}
