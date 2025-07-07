import { InvoiceDetail } from '@/types';

/**
 * 請求
 *
 * @param id - ID
 * @param invoice_date - 請求日
 * @param invoice_month - 請求月
 * @param customer_id - 得意先ID
 * @param customer_name - 得意先名
 * @param zip_code - 郵便番号
 * @param address1 - 住所1
 * @param address2 - 住所2
 * @param tel - TEL
 * @param fax - FAX
 * @param user_id - 担当者ID
 * @param user_name - 担当者名
 * @param pre_amount - 前回請求金額
 * @param total_receipt - 入金額合計
 * @param carried_forward - 繰越金額
 * @param total_amount - 合計金額
 * @param total_tax - 消費税
 * @param total_invoice - 今回請求金額
 * @param remarks - 備考
 * @param sales_tax_rate - 消費税率
 * @param details - 発注明細
 */
export interface Invoice {
  id: number | undefined;
  invoice_date: string;
  invoice_month: string;
  customer_id: number | undefined;
  customer_name: string | undefined;
  zip_code: string | undefined;
  address1: string | undefined;
  address2: string | undefined;
  tel: string | undefined;
  fax: string | undefined;
  user_id: number | undefined;
  user_name: string | undefined;
  pre_amount: number | undefined;
  total_receipt: number | undefined;
  carried_forward: number | undefined;
  total_amount: number | undefined;
  total_tax: number | undefined;
  total_invoice: number | undefined;
  remarks: string | undefined;
  sales_tax_rate: number | undefined;
  details: InvoiceDetail[];
}
