import { CommonDataDetail } from './CommonDataDetail';

/**
 * データ共通
 *
 * @param id - ID
 * @param delivery_date - 納入期日
 * @param customer_id - 得意先ID
 * @param customer_name - 得意先名
 * @param send_flg - 発送
 * @param name - 届け先名
 * @param zip_code - 郵便番号
 * @param address1 - 住所1
 * @param address2 - 住所2
 * @param tel - TEL
 * @param fax - FAX
 * @param corporate_class - 支払方法 1:現金、2:掛売、3:宅配代引、4:銀行振込、5:クレジットカード
 * @param user_id - 担当者ID
 * @param user_name - 担当者名
 * @param shipping_amount - 送料
 * @param fee - 手数料
 * @param discount - 値引
 * @param total_amount - 合計金額
 * @param order_no - 注文番号
 * @param remarks - 備考
 * @param rate - 掛率
 * @param sales_tax_rate - 消費税率
 * @param fraction - 端数処理
 */
export interface CommonData {
  id: number | undefined;
  delivery_date: string | undefined;
  customer_id: number | undefined;
  customer_name: string | undefined;
  send_flg: boolean | undefined;
  name: string | undefined;
  zip_code: string | undefined;
  address1: string | undefined;
  address2: string | undefined;
  tel: string | undefined;
  fax: string | undefined;
  corporate_class: number | undefined;
  user_id: number | undefined;
  user_name: string | undefined;
  shipping_amount: number | undefined;
  fee: number | undefined;
  discount: number | undefined;
  total_amount: number;
  order_no: string | undefined;
  remarks: string | undefined;
  rate: number;
  sales_tax_rate: number | undefined;
  fraction: number;
  details: CommonDataDetail[];
}
