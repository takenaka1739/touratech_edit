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

  return errors;
};
