/**
 * 商品
 *
 * @param id - ID
 * @param item_number - 品番
 * @param name - 商品名
 * @param name_jp - 商品名（納品書）
 * @param name_label - 商品名（ラベル用）
 * @param category_id - 商品分類ID
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
 * @param domestic_stocks - 国内在庫数
 * @param overseas_stocks - 国外在庫数
 * @param stock_display - 在庫表示 1:非表示、2:表示、3:表示（業者のみ）
 * @param remarks - 備考
 * 
 * @param id
 * @param supplier_id
 * @param consumption_tax_id
 * @param code
 * @param name
 * @param variation_code1
 * @param variation_code2
 * @param variation_code3
 * @param variation_code4
 * @param variations1
 * @param variations2
 * @param variations3
 * @param variations4
 * @param explanation
 * @param explanation_details
 * @param name_note
 * @param name_label
 * @param is_sell
 * @param purchase_price
 * @param sales_price
 * @param sales_unit_price
 * @param purchase_unit_price
 * @param sample_price
 * @param is_discontinued
 * @param discontinued_at
 * @param is_display
 * @param is_point_rebates
 * @param number_reservations
 * @param is_shipping_fee
 * @param is_cash_delivery_fee
 * @param additional_shipping_fee
 * @param is_payment_id1
 * @param is_payment_id2
 * @param is_payment_id3
 * @param is_payment_id4
 * @param is_payment_id5
 */

export interface Item {

  id: number | undefined;
  supplier_id?: number | undefined;
  code: string | undefined;
  name: string | undefined;
  item_number: string | undefined;
  itemNumberItem: string[];
  variations1: string | undefined;
  variations2: string | undefined;
  variations3: string | undefined;
  variations4: string | undefined;
  variations5: string | undefined;
  explanation?: string | undefined;
  explanation_details?: string | undefined;
  name_note?: string | undefined;
  name_label?: string | undefined;
  is_sell?: boolean | undefined;
  purchase_price?: number | undefined;
  sales_price: number | undefined;
  salesPriceItem: string[];
  special_sale_id?: number | undefined;
  sales_unit_price?: number | undefined;
  purchase_unit_price?: number | undefined;
  sample_price?: number | undefined;
  is_discontinued?: boolean | undefined;
  discontinued_at: string | undefined;
  is_display?: boolean | undefined;
  is_point_rebates?: boolean | undefined;
  number_reservations?: number | undefined;
  shipping_pay?: number | undefined;
  is_shipping_fee?: boolean | undefined;
  is_cash_delivery_fee?: boolean | undefined;
  additional_shipping_fee?: number | undefined;
  is_payment_id1?: boolean | undefined;
  is_payment_id2?: boolean | undefined;
  is_payment_id3?: boolean | undefined;
  is_payment_id4?: boolean | undefined;
  is_payment_id5?: boolean | undefined;
  variItems: string[][];
  backVariItems: string[][];

  stock_display?: number | undefined;
  category_id?: number | undefined;
  category_name?: string | undefined;
  supplier_name?: string | undefined;
  domestic_stocks?: number | undefined;
  overseas_stocks?: number | undefined;
  display_status: number |undefined;
  remarks?: string | undefined;
  is_set_item: boolean | undefined;
  imageItem: string[][];
  image_name: any;

  item_id: number | undefined;
  is_sales_members_only: boolean | undefined;
  start_at?: string | undefined;
  end_at?: string | undefined;
  special_sale_price?: number | undefined;
  refund_rate?: number | undefined;

  codeList: any[];
  specialSalesList: any[];
  specialSalesDelFlag: boolean | undefined;
  imageList: any[][];
  combination_id: number | undefined;
  combIdList: any[];

  send_trader?: number | undefined;
  send_personal?: number | undefined;
}
