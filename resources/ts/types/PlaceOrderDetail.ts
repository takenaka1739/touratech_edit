/**
 * 発注明細
 *
 * @param id - ID
 * @param no - 並び順
 * @param item_kind - 商品種類 1:単品、2:セット品、3:セット品に含まれる単品
 * @param item_id - 商品ID
 * @param item_number - 品番
 * @param iten_name - 商品名
 * @param item_name_jp - 商品名（納品書）
 * @param unit_price - 単価
 * @param quantity - 数量
 * @param amount - 金額
 * @param sales_tax_rate - 消費税率
 * @param sales_tax - 消費税
 * @param fraction - 端数処理
 * @param receive_order_detail_id - 受注明細ID
 */
export interface PlaceOrderDetail {
  id: number | undefined;
  place_order_id: number | undefined;
  no: number | undefined;
  item_kind: number | undefined;
  item_id: number | undefined;
  item_number: string;
  item_name: string;
  item_name_jp: string | undefined;
  unit_price: number | undefined;
  quantity: number | undefined;
  amount: number | undefined;
  sales_tax_rate: number | undefined;
  sales_tax: number | undefined;
  fraction: number;
  receive_order_detail_id: number | undefined;
}
