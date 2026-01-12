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
    (state.is_payment_id1 == null || state.is_payment_id1 === false) &&
    (state.is_payment_id2 == null || state.is_payment_id2 === false) &&
    (state.is_payment_id3 == null || state.is_payment_id3 === false) &&
    (state.is_payment_id4 == null || state.is_payment_id4 === false) &&
    (state.is_payment_id5 == null || state.is_payment_id5 === false);

  if (noPaymentSelected) {
    return '支払い方法を選択してください';
  }
  return null;
};

/**
 * バリエーションの未入力を検出し、入力不足時はエラーメッセージを返す。
 * 
 * @param variItems - バリエーション配列
 * @returns エラーあり：エラーメッセージ、エラーなし：null
 */
const validateVariations = (variItems: unknown[][]): { row: number; message: string }[] => {
  if (!variItems || variItems.length <= 1) return [];

  for (let i = 0; i < variItems.length; i++) {
    const row = variItems[i];
    const v = [row[1], row[2], row[3], row[4]];
    const sku = row[5];
    const price = row[6];

    // 品番・価格は必須
    if (sku === '' || sku === null || price === '' || price === null) {
      return [{ row: i, message: 'バリエーションを入力してください' }];
    }

    // null 以外の先頭は入力必須
    const firstCol = [0, 1, 2, 3].find(col => v[col] !== null);
    if (firstCol !== undefined && v[firstCol] === '') {
      return [{ row: i, message: 'バリエーションを入力してください' }];
    }

    // 同一行内の穴あき禁止
    let seenValue = false;
    for (let col = 0; col < 4; col++) {
      if (v[col] !== null && v[col] !== '') {
        seenValue = true;
      } else if (v[col] === '') {
        const hasValueLater = [col + 1, col + 2, col + 3]
          .filter(c => c < 4)
          .some(c => v[c] !== null && v[c] !== '');
        if (seenValue && hasValueLater) {
          return [{ row: i, message: 'バリエーションを入力してください' }];
        }
      }
    }
  }

  const getFirstInputCol = (row: any[]) => {
    const col = [1, 2, 3, 4].find(c => row[c] !== null);
    return col ?? 1;
  };

  for (let i = 0; i < variItems.length; i++) {
    const firstInputCol_i = getFirstInputCol(variItems[i]);
    const checkFlags = [false, false, false, false];

    for (let j = i + 1; j < variItems.length; j++) {
      const firstInputCol_j = getFirstInputCol(variItems[j]);

      // 次の要素のチェックに進む
      if (firstInputCol_j <= firstInputCol_i) break;

      // チェック済、または紐づきのないインデックスはスキップ
      const firstTrueIndex = checkFlags.indexOf(true);
      const limitCol = firstTrueIndex === -1 ? 5 : firstTrueIndex + 1;
      if (firstInputCol_j >= limitCol) continue;

      // 未入力判定対象に追加
      const idx = firstInputCol_j - 1;
      if (!checkFlags[idx]) checkFlags[idx] = true;
    }

    // checkFlags が true の位置で i 行が空欄ならエラー
    for (let col = 1; col <= 4; col++) {
      if (checkFlags[col - 1] && variItems[i][col] === '') {
        return [{ row: i, message: 'バリエーションを入力してください' }];
      }
    }
  }

  // 品番（col=5）の重複チェック
  const skuMap: Map<string, number[]> = new Map();

  variItems.forEach((row, rowIndex) => {
    const sku = row[5] as string | null;
    if (sku && sku.trim() !== "") {
      if (!skuMap.has(sku)) {
        skuMap.set(sku, []);
      }
      skuMap.get(sku)!.push(rowIndex);
    }
  });

  // 同じ品番が2行以上ある場合、最初の行をエラーとして返す
  for (const rows of Array.from(skuMap.values()) as number[][]) {
    if (rows.length >= 2) {
      return [{ row: rows[0], message: '同じ品番が複数行に存在します' }];
    }
  }

  // 価格の上限チェック（1億まで）
  for (let i = 0; i < variItems.length; i++) {
    const price = variItems[i][6];

    // 数値に変換できない or 上限超え
    const num = Number(price);
    if (Number.isNaN(num) || num >= 100000000) {
      return [{ row: i, message: '価格は1億未満で入力してください' }];
    }
  }

  return [];
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
  const validCategories = state.categoryList.filter((x: ItemCategory) => x.status !== 'del');
  if (validCategories.length === 0 || validCategories.every(x => x.categoryId === null))
    errors.categoryList = '商品分類を入力してください';

  // 仕入単価
  if (state.purchase_unit_price === null || state.purchase_unit_price === undefined)
    errors.purchase_unit_price = '仕入単価を入力してください';

  // 仕入先
  if (state.supplier_name === null || state.supplier_name === undefined || state.supplier_name === '')
    errors.supplier_name = '仕入先を入力してください';

  // 在庫表示
  if (state.display_status === null || state.display_status === undefined)
    errors.display_status = '在庫表示を選択してください';

  // 商品コード
  if (state.code === null || state.code === undefined || state.code === '')
    errors.code = '商品コードを入力してください';

  // 販売価格（税込）
  if (state.sales_price === null || state.sales_price === undefined)
    errors.sales_price = '販売価格を入力してください';

  // 支払い方法適用（現金・掛売・宅配代引・クレジットカード・銀行振込）
  const paymentError = validatePaymentMethods(state);
  if (paymentError) {
    //errors.is_payment_id1 = paymentError;
    errors.payErrorMessage = paymentError;
  }

  // バリエーション
  const variationErrors = validateVariations(state.variItems);
  variationErrors.forEach(err => {
    errors[`variation_${err.row}`] = err.message;
  });

  return errors;
};
