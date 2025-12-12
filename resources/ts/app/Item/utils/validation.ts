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
 * 同一インデックス同士の直前データとの一致判定。
 * 
 * @param value1 - 値1
 * @param value2 - 値2
 * @returns 一致：true、不一致：false
 */
const isWildcardEqual = (value1: unknown, value2: unknown): boolean => {
  if (value1 === null || value2 === null) return true;                        // null は何とでも一致扱い（ワイルドカード）
  if (value1 === '' || value2 === '') return value1 === '' && value2 === '';  // 空は空同士のみ一致
  return value1 === value2;                                                   // 文字列は完全一致
};

/**
 * バリエーションの未入力を検出し、入力不足時はエラーメッセージを返す。
 * 
 * @param variItems - バリエーション配列
 * @returns エラーあり：エラーメッセージ、エラーなし：null
 */
const validateVariations = (variItems: unknown[][]): { row: number; message: string }[] => {
  const errors: { row: number; message: string }[] = [];
  // バリエーションが複数無い場合は判定不要
  if (!variItems || variItems.length <= 1) return errors;

  for (let index = 0; index < variItems.length; index++) {
    const v = variItems[index];
    const variationValues = [v[1], v[2], v[3], v[4]];
    const hasInput = variationValues.some(val => val !== null && val !== '');

    // バリエーション必須
    if (!hasInput) {
      errors.push({ row: index, message: 'バリエーションを入力してください' });
    }

    // 品番必須
    if (isEmpty(v[5])) {
      errors.push({ row: index, message: '品番を入力してください' });
    }

    // 販売価格必須
    if (isEmpty(v[6])) {
      errors.push({ row: index, message: '販売価格を入力してください' });
    }

    // 直前行との比較
    if (index > 0) {
      const prev = variItems[index - 1];
      const prevValues = [prev[1], prev[2], prev[3], prev[4]];

      // 一致判定（nullはワイルドカード）
      const isSame = variationValues.every((val, i) =>
        isWildcardEqual(val, prevValues[i])
      );
      if (isSame) {
        errors.push({
          row: index,
          message: '直前の行と同一です。異なるバリエーションを入力してください',
        });
      }

      // 初めて null 以外となった要素のインデックスを特定
      const firstNonNullIndex = variationValues.findIndex(val => val !== null && val !== '');
      if (firstNonNullIndex !== -1) {
        const prevVal = prevValues[firstNonNullIndex];
        // 直前行の同じインデックスが文字列でなければエラー
        if (prevVal === '') {
          errors.push({
            row: index - 1,   // 未入力である直前行にエラーを付与
            message: '分岐点にはバリエーションを入力してください',
          });
        }
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
