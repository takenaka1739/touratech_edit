import { PurchaseDetail } from '@/types';

/**
 * 仕入
 *
 * @param id - ID
 * @param purchase_date - 仕入日
 * @param user_id - 担当者ID
 * @param user_name - 担当者名
 * @param total_amount - 合計金額
 * @param remarks - 備考
 * @param sales_tax_rate - 消費税率
 * @param details - 仕入明細
 * @param place_order_id - 発注ID
 */
export type Purchase = {
  id: number | undefined;
  purchase_date: string;
  user_id: number | undefined;
  user_name: string | undefined;
  total_amount: number;
  remarks: string | undefined;
  sales_tax_rate: number | undefined;
  details: PurchaseDetail[];
  place_order_id?: number | undefined;
};
