<?php

namespace App\Api\TopImage\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Log;

class TopImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'image_id'   => ['required', 'numeric', 'exists:m_images,id'],
            'url'        => ['nullable', 'string', 'max:255'],
            'is_enabled' => ['required'],
        ];
    }

    public function prepareForValidation(): void
    {
        Log::debug('📥 TopImageRequest raw input:', $this->all());

        $this->merge([
            'image_id' => (int) $this->input('image_id'),
            'is_enabled' => filter_var($this->input('is_enabled'), FILTER_VALIDATE_BOOLEAN),
        ]);

        Log::debug('🛠 TopImageRequest after merge:', $this->all());
    }

    public function attributes(): array
    {
        return [
            'image_id'   => '画像',
            'url'        => 'リンク先URL',
            'is_enabled' => '表示/非表示',
        ];
    }
}
