import { Item } from '@/types/Item';

type VariationTuple = [number, string, string, string, string, string, number];

/**
 * バリエーション配列から item に値を適用するユーティリティ関数。
 * 
 * @param item - 商品情報
 * @param value - バリエーション配列 [id, v1, v2, v3, v4, item_number, sales_price]
 * @param matchedRow 
 */
export const applyVariationToItem = (item: Item, value: VariationTuple, matchedRow?: Item): void => {
  item.id = matchedRow ? Number(matchedRow.id) : undefined;
  item.item_id = matchedRow ? Number(matchedRow.id) : undefined;
  item.variations1 = value[1] ?? matchedRow?.variations1;
  item.variations2 = value[2] ?? matchedRow?.variations2;
  item.variations3 = value[3] ?? matchedRow?.variations3;
  item.variations4 = value[4] ?? matchedRow?.variations4;
  item.item_number = value[5] ?? matchedRow?.item_number;
  item.sales_price = value[6] ?? matchedRow?.sales_price;
};