import { Calendar } from '@/types/Calendar';

/**
 * 商品マスタの必須項目の未入力を検出し、入力不足時はエラーメッセージを返す。
 * 
 * @param state - 商品情報を保持する Item 型のオブジェクト
 * @returns エラーあり：エラーメッセージ、エラーなし：null
 */
export const validateItemState = (state: Calendar): Record<string, string> => {
  const errors: Record<string, string> = {};

  console.dir(state);

  // イベント名
  if (state.name == null || state.name === '')
    errors.name = 'イベント名を入力してください';

  if ((state.start_at == null || state.start_at === '') && (state.end_at == null || state.end_at === '')){
    errors.start_at = '開始日を入力してください';
    errors.end_at = '終了日を入力してください';
    errors.atErrorMsg = '開始日 / 終了日を入力してください';
  }else{

    // 開始日
    if (state.start_at == null || state.start_at === ''){
      errors.atErrorMsg = '開始日を入力してください';
      errors.start_at = '開始日を入力してください';
    }

    // 開始日
    if (state.end_at == null || state.end_at === ''){
      errors.atErrorMsg = '終了日を入力してください';
      errors.end_at = '終了日を入力してください';
    }
  }

  return errors;
};
