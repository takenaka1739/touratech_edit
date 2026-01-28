import { Customer } from '@/types/Customer';

/**
 * 得意先マスタの住所1の未入力を検出し、入力不足時はエラーメッセージを返す。
 * 
 * @param state - 得意先情報を保持する Customer 型のオブジェクト
 * @returns エラーあり：エラーメッセージ、エラーなし：null
 */
export const validateItemState = (state: Customer): Record<string, string> => {
  const errors: Record<string, string> = {};

  console.dir(state);

  // イベント名
  if (state.address1 == null || state.address1 === ''){
    errors.address1 = '住所1を入力してください';
  }

  if (state.name == null || state.name === ''){
    errors.name = '得意先を入力してください';
  }

  if (state.kana == null || state.kana === ''){
    errors.kana = 'カナを入力してください';
  }

  if (state.zip_code == null || state.zip_code === ''){
    errors.zip_code = '郵便番号を入力してください';
  }

  if (state.tel == null || state.tel === ''){
    errors.tel = '電話番号を入力してください';
  }

  if (state.email_main == null || state.email_main === ''){
    errors.email_main = 'EMAIL(MAIN)を入力してください';
  }

  if (state.cutoff_date == null || String(state.cutoff_date) === ''){
    errors.cutoff_date = '締日を入力してください';
  }

  if (state.rate == null || String(state.rate) === ''){
    errors.rate = '掛率を入力してください';
  }

  return errors;
};
