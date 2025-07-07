import { CommonDataDetail } from './CommonDataDetail';

/**
 * 見積明細
 *
 * @param estimate_id - 見積ID
 */
export interface EstimateDetail extends CommonDataDetail {
  estimate_id: number | undefined;
}
