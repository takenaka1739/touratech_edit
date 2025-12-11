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
const validateVariations = (variItems: unknown[][]): string | null => {
  if (!variItems || variItems.length <= 1) return null;

  for (let index = 0; index < variItems.length; index++) {
    const v = variItems[index];

    // 1〜4を対象キーとして扱う
    const nonEmptyFlags = [1, 2, 3, 4].map(i => !isEmpty(v[i]));
    const anyFilled = nonEmptyFlags.some(Boolean);

    // 先頭行: カテゴリー1は必須
    if (index === 0 && isEmpty(v[1])) {
      return 'カテゴリー1を入力してください';
    }

    // 最低1つは入力（先頭以外の行）
    if (index !== 0 && !anyFilled) {
      return 'いずれかのカテゴリーを入力してください';
    }

    // 左詰めチェック
    let foundEmpty = false;
    for (let i = 1; i <= 4; i++) {
      const empty = isEmpty(v[i]);
      if (!foundEmpty && empty) {
        foundEmpty = true;
      } else if (foundEmpty && !empty) {
        return '左詰めで入力してください（途中に空欄があります）';
      }
    }

    // 階層整合性チェック
    if (!isEmpty(v[2]) && isEmpty(v[1])) {
      return 'カテゴリー2を入力する場合、カテゴリー1が必要です';
    } else if (!isEmpty(v[3]) && (isEmpty(v[1]) || isEmpty(v[2]))) {
      return 'カテゴリー3を入力する場合、カテゴリー1・2が必要です';
    } else if (!isEmpty(v[4]) && (isEmpty(v[1]) || isEmpty(v[2]) || isEmpty(v[3]))) {
      return 'カテゴリー4を入力する場合、カテゴリー1〜3が必要です';
    }

    // バリエーション品番（v[6]）必須チェック
    if (isEmpty(v[6])) {
      return 'バリエーション品番を入力してください';
    }

    // 差分チェック（直前の行と比較）
    if (index > 0) {
      const prev = variItems[index - 1];
      const isSame = [1, 2, 3, 4].every(i => v[i] === prev[i]);
      if (isSame) {
        return '直前の行と全て同じです。必ず1箇所は差分を入力してください';
      }
    }
  }

  return null; // エラーなし
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
  const variationError = validateVariations(state.variItems);
  if (variationError) {
    errors.variation = variationError;
  }

  return errors;
};
