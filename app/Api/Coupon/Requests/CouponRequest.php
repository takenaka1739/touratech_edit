<?php

namespace App\Api\Coupon\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CouponRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:12'],
            'name' => ['required', 'string', 'max:100'],
            'details' => ['nullable', 'string', 'max:255'],
            'start_at' => ['required', 'date'],
            'end_at' => ['required', 'date', 'after_or_equal:start_at'],
        ];
    }

    public function attributes(): array
    {
        return [
            'code' => 'クーポンコード',
            'name' => 'クーポン名',
            'details' => '詳細',
            'start_at' => '開始日',
            'end_at' => '終了日',
        ];
    }
}
