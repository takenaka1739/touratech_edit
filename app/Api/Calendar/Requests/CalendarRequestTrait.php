<?php

namespace App\Api\Calendar\Requests;
use Illuminate\Validation\Rule;

/**
 * カレンダーマスタ共通フォームバリデーション
 */
trait CalendarRequestTrait
{
  public function commonRules()
  {
    return [
    //  //'id' => 'unsigned',
      'name'         => 'nullable|string|max:500',
      'start_at'     => 'nullable|date',
      'end_at'       => 'nullable|date',
      'font_color'   => 'nullable|string|max:30',
      'back_color'   => 'nullable|string|max:30',
      'is_monday'    => 'nullable|boolean',
      'is_tuesday'   => 'nullable|boolean',
      'is_wednesday' => 'nullable|boolean',
      'is_thursday'  => 'nullable|boolean',
      'is_friday'    => 'nullable|boolean',
      'is_saturday'  => 'nullable|boolean',
      'is_sunday'    => 'nullable|boolean',
      'trans_flag'   => 'nullable|boolean',
    ];
  }

  public function attributes()
  {
    return [
      'name'         => 'イベント名',
      'start_at'     => '開始日',
      'end_at'       => '終了日',
    ];
  }
}