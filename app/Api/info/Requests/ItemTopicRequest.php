<?php

namespace App\Api\info\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ItemTopicRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'published_at' => 'required|date',
            'title'        => 'required|string|max:128',
            'body'         => 'required|string',
        ];
    }
}
