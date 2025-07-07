/**
 * 商品
 *
 * @param id - ID
 * @param item_number - 品番
 * @param name - 商品名
 * @param name_jp - 商品名（納品書）
 * @param name_label - 商品名（ラベル用）
 * @param item_classification_id - 商品分類ID
 * @param item_classification_name - 商品分類名
 * @param sales_unit_price - 売上単価
 * @param purchase_unit_price - 仕入単価
 * @param sample_price - サンプル品単価
 * @param supplier_id - 仕入先ID
 * @param supplier_name - 仕入先名
 * @param is_discontinued - 廃盤予定 0:OFF、1:ON
 * @param discontinued_date - 廃盤日
 * @param is_display - 表示 0:非表示、1:表示
 * @param is_set_item - セット品フラグ 0:単品、1:セット品
 * @param domestic_stock - 国内在庫数
 * @param overseas_stock - 国外在庫数
 * @param stock_display - 在庫表示 1:非表示、2:表示、3:表示（業者のみ）
 * @param remarks - 備考
 */
export interface Item {
  id: number | undefined;
  item_number?: string | undefined;
  name?: string | undefined;
  name_jp: string | undefined;
  name_label?: string | undefined;
  item_classification_id?: number | undefined;
  item_classification_name?: string | undefined;
  sales_unit_price: number | undefined;
  purchase_unit_price?: number | undefined;
  sample_price?: number | undefined;
  supplier_id?: number | undefined;
  supplier_name?: string | undefined;
  is_discontinued?: boolean | undefined;
  discontinued_date: string | undefined;
  is_display: boolean | undefined;
  is_set_item: boolean | undefined;
  domestic_stock?: number | undefined;
  overseas_stock?: number | undefined;
  stock_display?: number | undefined;
  remarks?: string | undefined;
}
