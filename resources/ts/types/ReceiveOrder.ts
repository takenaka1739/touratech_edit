import { CommonData } from './CommonData';
import { ReceiveOrderDetail } from '@/types';

/**
 * 受注
 *
 * @param receive_order_date - 受注日
 * @param estimate_id - 見積ID
 * @param has_sales - 売上 0:なし、1:売上済〇、3:一部△
 */
export interface ReceiveOrder extends CommonData {
  receive_order_date: string;
  details: ReceiveOrderDetail[];
  estimate_id?: number | undefined;
  has_sales?: number | undefined;
  has_place?: number | undefined;
}
