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
        return [
            // 画像ファイル名（DBに保存される name）を必須・一意に
            'name' => [
                'required',
                'string',
                'max:255',
                // m_images.name の一意制約（deleted_at が NULL のもののみ対象＝ソフトデリートは無視）
                Rule::unique('m_images', 'name')->whereNull('deleted_at'),
            ],
            // 既存仕様踏襲：ファイル添付は任意、画像のみ、サイズ上限は必要に応じて変更可
            'file' => [
                'nullable',
                'file',
                'image',
                'mimes:jpg,jpeg,png,gif,webp',
                'max:5120', // 5MB
            ],
            // 既存仕様踏襲：カテゴリIDは任意
            'category_id' => [
                'nullable',
                'integer',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => '画像名は必須です。',
            'name.unique'   => '同名の画像が既に存在します。別名にしてください。',
            'name.max'      => '画像名は255文字以内で入力してください。',
            'file.image'    => '画像ファイルを選択してください。',
            'file.mimes'    => 'アップロードできる拡張子は jpg, jpeg, png, gif, webp です。',
            'file.max'      => '画像サイズは5MB以下にしてください。',
        ];
    }
}
