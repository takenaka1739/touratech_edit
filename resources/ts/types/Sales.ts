import { CommonData } from './CommonData';
import { SalesDetail } from '@/types';

/**
 * 売上データ
 *
 * @param sales_date - 売上日
 * @param details - 見積明細
 * @param receive_order_id - 受注ID
 */
export interface Sales extends CommonData {
  sales_date: string | undefined;
  details: SalesDetail[];
  receive_order_id?: number | undefined;
  has_invoice?: boolean | undefined;
}
