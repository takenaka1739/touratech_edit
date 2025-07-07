import { CommonDataDetail } from './CommonDataDetail';

/**
 * 売上明細
 *
 * @param sales_id - 売上ID
 */
export interface SalesDetail extends CommonDataDetail {
  sales_id: number | undefined;
  receive_order_detail_id: number | undefined;
}
