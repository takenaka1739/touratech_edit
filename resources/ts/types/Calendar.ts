/**
 * カレンダー
 *
 * @param id - ID
 * @param name - イベント名
 * @param start_at - 開始日
 * @param end_at - 開始日
 * @param is_monday - 月曜日の定期フラグ
 * @param is_tuesday - 火曜日の定期フラグ
 * @param is_wednesday - 水曜日の定期フラグ
 * @param is_thursday - 木曜日の定期フラグ
 * @param is_friday - 金曜日の定期フラグ
 * @param is_saturday - 土曜日の定期フラグ
 * @param is_sunday - 日曜日の定期フラグ
 * @param font_color - 文字色
 * @param backColor - 背景色
 */

export interface Calendar {
  id: number | undefined;
  name: string | undefined;
  start_at: string | undefined;
  end_at: string | undefined;
  is_monday: boolean | undefined;
  is_tuesday: boolean | undefined;
  is_wednesday: boolean | undefined;
  is_thursday: boolean | undefined;
  is_friday: boolean | undefined;
  is_saturday: boolean | undefined;
  is_sunday: boolean | undefined;
  font_color: string | undefined;
  back_color: string | undefined;
  trans_flag: boolean | undefined;
}
