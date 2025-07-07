/**
 * 請求明細
 *
 * @param id - ID
 * @param no - 並び順
 * @param job_date - 伝票日付
 * @param detail_kind - 伝票種類
 * @param item_kind - 商品種類 1:単品、2:セット品、3:セット品に含まれる単品
 * @param item_id - 商品ID
 * @param iten_name - 商品名
 * @param unit_price - 売上単価
 * @param quantity - 数量
 * @param amount - 金額
 * @param sales_tax_rate - 消費税率
 * @param sales_tax - 消費税
 */
export interface InvoiceDetail {
  id: number | undefined;
  no: number | undefined;
  job_date: string | undefined;
  detail_kind: number | undefined;
  item_kind: number | undefined;
  item_id: number | undefined;
  item_name: string;
  unit_price: number | undefined;
  quantity: number | undefined;
  amount: number | undefined;
  sales_tax_rate: number | undefined;
  sales_tax: number | undefined;
}
