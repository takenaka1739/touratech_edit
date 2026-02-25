<?php

namespace App\Api\ShopMail\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MailTemplateStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // 認可が必要なら後で Gate/Policy に差し替え
    }

    public function rules(): array
    {
        return [
            'template_type'       => ['required', 'integer'], // 1:自動返信, 2:個別 など運用に合わせる
            'name'                => ['required', 'string', 'max:100'],
            'subject_template'    => ['required', 'string', 'max:60'],
            'header_template'     => ['nullable', 'string', 'max:2048'],
            'footer_template'     => ['nullable', 'string', 'max:2048'],

            // 個別メール要素
            'detail_mode'         => ['nullable', 'integer'], // 0:表示しない, 1:表示する
            'payment_url_enabled' => ['nullable', 'integer'], // 0/1
            'shipping_text'       => ['nullable', 'string', 'max:2048'],

            'is_active'           => ['nullable', 'integer'], // 0/1
        ];
    }
}
