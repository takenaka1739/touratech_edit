import { CommonDataDetail } from './CommonDataDetail';

/**
 * 受注明細
 *
 * @param receive_order_id - 受注ID
 */
export type ReceiveOrderDetail = CommonDataDetail & {
  receive_order_id: number | undefined;
  estimate_detail_id: number | undefined;
  purchase_unit_price?: number | undefined;
};
