<?php

namespace App\Api\info\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInfoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'              => ['required', 'string', 'max:200'],
            'body'               => ['required', 'string'],
            'status'             => ['nullable', 'in:draft,published,archived,scheduled'],
            'published_at'       => ['nullable', 'date'],
            'related_product_id' => ['nullable', 'integer', 'exists:m_items,id'],

            'meta'               => ['nullable', 'array'],
            'meta.external_url'  => ['nullable', 'string', 'url', 'max:512'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'タイトルは必須です。',
            'body.required'  => '内容は必須です。',
            'status.in'      => '公開状態が不正です。',
            'meta.external_url.url' => '外部サイトURLの形式が正しくありません。',
        ];
    }
}
