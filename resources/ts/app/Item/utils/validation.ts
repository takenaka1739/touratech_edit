import { Item } from '@/types/Item';
import { ItemCategory } from '@/types/ItemCategory';

/**
 * 支払方法の未選択を検出し、未選択時はエラーメッセージを返す。
 * 
 * @param state - 商品情報を保持する Item 型のオブジェクト
 * @returns エラーあり：エラーメッセージ、エラーなし：null
 */
const validatePaymentMethods = (state: Item): string | null => {
  const noPaymentSelected =
    (state.is_payment_id1 === null || state.is_payment_id1 === undefined || state.is_payment_id1 === false) &&
    (state.is_payment_id2 === null || state.is_payment_id2 === undefined || state.is_payment_id2 === false) &&
    (state.is_payment_id3 === null || state.is_payment_id3 === undefined || state.is_payment_id3 === false) &&
    (state.is_payment_id4 === null || state.is_payment_id4 === undefined || state.is_payment_id4 === false) &&
    (state.is_payment_id5 === null || state.is_payment_id5 === undefined || state.is_payment_id5 === false);

  if (noPaymentSelected) {
    return '支払い方法を選択してください';
  }
  return null;
};

/**
 * バリエーションの空データを判定するユーティリティ。
 * 
 * @param v - 判定対象の値（null, undefined, 空文字を想定）
 * @returns 値なし：true、値あり：false
 */
const isEmpty = (v: unknown): boolean => v === null || v === undefined || v === '';

/**
 * バリエーションの未入力を検出し、入力不足時はエラーメッセージを返す。
 * 
 * @param variItems - バリエーション配列
 * @returns エラーあり：エラーメッセージ、エラーなし：null
 */
const validateVariations = (variItems: unknown[][]): { row: number; message: string }[] => {
  const errors: { row: number; message: string }[] = [];
  if (!variItems || variItems.length <= 1) return errors;

  for (let index = 0; index < variItems.length; index++) {
    const v = variItems[index];
    const variationValues = [v[1], v[2], v[3], v[4]];
    const hasInput = variationValues.some(val => val !== null && val !== '');

    if (!hasInput) {
      errors.push({ row: index, message: 'いずれかのカテゴリーを入力してください' });
      continue;
    }

    if (isEmpty(v[5])) {
      errors.push({ row: index, message: '品番を入力してください' });
      continue;
    }

    if (isEmpty(v[6])) {
      errors.push({ row: index, message: '販売価格を入力してください' });
      continue;
    }

    if (index > 0) {
      const prev = variItems[index - 1];
      const currentFiltered = variationValues.map(val => (val === null ? null : val));
      const prevFiltered = [prev[1], prev[2], prev[3], prev[4]].map(val => (val === null ? null : val));

      const isSame = currentFiltered.every((val, i) => val === prevFiltered[i]);
      if (isSame) {
        errors.push({ row: index, message: '直前の行と全て同じです。必ず1箇所は差分を入力してください' });
      }
    }
  }

  return errors;
};

/**
 * 商品マスタの必須項目の未入力を検出し、入力不足時はエラーメッセージを返す。
 * 
 * @param state - 商品情報を保持する Item 型のオブジェクト
 * @returns エラーあり：エラーメッセージ、エラーなし：null
 */
export const validateItemState = (state: Item): Record<string, string> => {
  const errors: Record<string, string> = {};

  // 品番
  if (state.item_number === null || state.item_number === undefined || state.item_number === '')
    errors.item_number = '品番を入力してください';

  // 商品名
  if (state.name === null || state.name === undefined || state.name === '')
    errors.name = '商品名を入力してください';

  // 商品名（納品書）
  if (state.name_note === null || state.name_note === undefined || state.name_note === '')
    errors.name_note = '商品名（納品書）を入力してください';

  // 商品分類
  if (state.categoryList.length > 0 && state.categoryList.every((x: ItemCategory) => x.categoryId === null))
    errors.categoryList = '商品分類を入力してください';

  // 仕入先
  if (state.supplier_name === null || state.supplier_name === undefined || state.supplier_name === '')
    errors.supplier_name = '仕入先を入力してください';

  // 在庫表示
  if (state.display_status === null || state.display_status === undefined)
    errors.display_status = '在庫表示を選択してください';

  // 商品コード
  if (state.code === null || state.code === undefined || state.code === '')
    errors.code = '商品コードを入力してください';

  // 支払い方法適用（現金・掛売・宅配代引・クレジットカード・銀行振込）
  const paymentError = validatePaymentMethods(state);
  if (paymentError) {
    errors.is_payment_id1 = paymentError;
  }

  // バリエーション
  const variationErrors = validateVariations(state.variItems);
  variationErrors.forEach(err => {
    errors[`variation_${err.row}`] = err.message;
  });

  return errors;
};
