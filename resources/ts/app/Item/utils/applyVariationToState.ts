import { Item } from '@/types/Item';

/**
 * バリエーション配列から item に値を適用するユーティリティ関数。
 *
 * @param item - 商品情報
 * @param value - バリエーション配列 [variIndex, v1, v2, v3, v4, item_number, sales_price]
 */
export const applyVariationToState = (item: Item, value: any[]): void => {
  item.variations1 = value[1];
  item.variations2 = value[2];
  item.variations3 = value[3];
  item.variations4 = value[4];
  item.item_number = value[5];
  item.sales_price = Number(value[6]);
};