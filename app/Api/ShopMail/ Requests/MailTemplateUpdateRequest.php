<?php

namespace App\Api\ShopMail\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MailTemplateUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'template_type'       => ['sometimes', 'integer'],
            'name'                => ['sometimes', 'string', 'max:100'],
            'subject_template'    => ['sometimes', 'string', 'max:60'],
            'header_template'     => ['nullable', 'string', 'max:2048'],
            'footer_template'     => ['nullable', 'string', 'max:2048'],

            'detail_mode'         => ['nullable', 'integer'],
            'payment_url_enabled' => ['nullable', 'integer'],
            'shipping_text'       => ['nullable', 'string', 'max:2048'],

            'is_active'           => ['nullable', 'integer'],
        ];
    }
}
