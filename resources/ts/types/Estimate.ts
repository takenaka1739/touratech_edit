import { CommonData } from './CommonData';
import { EstimateDetail } from '@/types';

/**
 * 見積データ
 *
 * @param estimate_date - 見積日
 * @param details - 見積明細
 */
export interface Estimate extends CommonData {
  estimate_date: string | undefined;
  details: EstimateDetail[];
  has_receive_order?: boolean | undefined;
}
