/**
 * データ明細共通
 *
 * @param id - ID
 * @param no - 並び順
 * @param item_kind - 商品種類 1:単品、2:セット品、3:セット品に含まれる単品
 * @param item_id - 商品ID
 * @param item_number - 品番
 * @param iten_name - 商品名
 * @param item_name_jp - 商品名（納品書）
 * @param sales_unit_price - 定価
 * @param rate - 掛率
 * @param unit_price - 単価
 * @param quantity - 数量
 * @param amount - 金額
 * @param sales_tax_rate - 消費税率
 * @param sales_tax - 消費税
 * @param fraction - 端数処理
 * @param answer_date - 回答納期
 */
export interface CommonDataDetail {
  id: number | undefined;
  no: number | undefined;
  item_kind: number | undefined;
  item_id: number | undefined;
  item_number: string | undefined;
  item_name: string | undefined;
  item_name_jp: string | undefined;
  sales_unit_price: number | undefined;
  rate: number;
  unit_price: number | undefined;
  quantity: number | undefined;
  amount: number | undefined;
  sales_tax_rate: number | undefined;
  sales_tax: number | undefined;
  fraction: number;
  answer_date?: string | undefined;
}
