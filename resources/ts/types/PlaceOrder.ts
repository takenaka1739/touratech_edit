import { PlaceOrderDetail } from '@/types';

/**
 * 発注
 *
 * @param id - ID
 * @param place_order_date - 発注日
 * @param user_id - 担当者ID
 * @param user_name - 担当者名
 * @param delivery_day - 納期日数
 * @param total_amount - 合計金額
 * @param remarks - 備考
 * @param fraction - 端数処理
 * @param sales_tax_rate - 消費税率
 * @param details - 発注明細
 * @param receive_order_id - 受注ID
 */
export interface PlaceOrder {
  id: number | undefined;
  place_order_date: string;
  user_id: number | undefined;
  user_name: string | undefined;
  delivery_day: string | undefined;
  total_amount: number;
  remarks: string | undefined;
  fraction: number;
  sales_tax_rate: number | undefined;
  details: PlaceOrderDetail[];
  receive_order_id?: number | undefined;
}
