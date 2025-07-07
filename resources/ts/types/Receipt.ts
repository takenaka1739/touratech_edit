/**
 * 入金
 *
 * @param id - ID
 * @param receipt_date - 入金日
 * @param customer_id - 得意先ID
 * @param customer_name - 得意先名
 * @param user_id - 担当者ID
 * @param user_name - 担当者名
 * @param total_amount - 合計金額
 * @param remarks - 備考
 */
export interface Receipt {
  id: number | undefined;
  receipt_date: string;
  customer_id: number | undefined;
  customer_name: string | undefined;
  user_id: number | undefined;
  user_name: string | undefined;
  total_amount: number;
  remarks: string | undefined;
}
