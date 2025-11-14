<?php

namespace App\Api\Calendar\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CalendarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules()
    {
        return [
            'name'         => ['nullable', 'string', 'max:500'],
            'start_at'     => ['nullable', 'date'],
            'end_at'       => ['nullable', 'date', 'after_or_equal:start_at'],
            'is_monday'    => ['nullable', 'boolean'],
            'is_tuesday'   => ['nullable', 'boolean'],
            'is_wednesday' => ['nullable', 'boolean'],
            'is_thursday'  => ['nullable', 'boolean'],
            'is_friday'    => ['nullable', 'boolean'],
            'is_saturday'  => ['nullable', 'boolean'],
            'is_sunday'    => ['nullable', 'boolean'],
            'back_color'   => ['nullable', 'string', 'max:30'],
            'font_color'   => ['nullable', 'string', 'max:30'],
            'trans_flag'   => ['nullable', 'boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => 'イベント名',
            'start_at' => '開始日',
            'end_at' => '終了日',
            'back_color' => '背景色'
        ];
    }
}
