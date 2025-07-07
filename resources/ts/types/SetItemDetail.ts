/**
 * セット品明細
 *
 * @param set_item_id - セット品ID
 * @param id - 明細番号
 * @param item_id - 商品ID
 * @param item_number - 品番
 * @param item_name - 商品名
 * @param item_name_jp - 商品名（納品書）
 * @param quantity - 数量
 * @param set_price - 売上単価（セット時）
 * @param sales_unit_price - 売上単価
 */
export interface SetItemDetail {
  set_item_id: number | undefined;
  id: number | undefined;
  item_id: number | undefined;
  item_number: string | undefined;
  item_name: string | undefined;
  item_name_jp: string | undefined;
  quantity: number | undefined;
  set_price: number | undefined;
  sales_unit_price: number | undefined;
}
