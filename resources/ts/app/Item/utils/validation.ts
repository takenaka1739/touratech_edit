/**
 * 商品マスタの未入力項目を検出し、エラーメッセージを返す。
 */
export const validateItemState = (state: any): Record<string, string> => {
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
  if (state.categoryList.length === 1 && state.categoryList[0].categoryId === null)
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

  // 販売価格

  // 支払い方法適用（現金・掛売・宅配代引・クレジットカード・銀行振込）
  if (
    (state.is_payment_id1 === null || state.is_payment_id1 === undefined || state.is_payment_id1 === false) &&
    (state.is_payment_id2 === null || state.is_payment_id2 === undefined || state.is_payment_id2 === false) &&
    (state.is_payment_id3 === null || state.is_payment_id3 === undefined || state.is_payment_id3 === false) &&
    (state.is_payment_id4 === null || state.is_payment_id4 === undefined || state.is_payment_id4 === false) &&
    (state.is_payment_id5 === null || state.is_payment_id5 === undefined || state.is_payment_id5 === false)
  ) {
    errors.is_payment_id1 = '支払い方法を選択してください';
  }

  return errors;
};