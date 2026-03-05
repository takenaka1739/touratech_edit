<?php

namespace App\Api\ShopMail\Requests;

use Illuminate\Foundation\Http\FormRequest;

class InquiryReplySendRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'mail_template_id' => ['nullable', 'integer'],
            'to_email'         => ['required', 'email'],
            'subject'          => ['required', 'string', 'max:180'],
            'body_text'        => ['required', 'string'],
        ];
    }
}