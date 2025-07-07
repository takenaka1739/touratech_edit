import { Item, SetItemDetail } from '@/types';

/**
 * セット品
 *
 * @param total_quantity - 総点数
 */
export interface SetItem extends Item {
  total_quantity: number | undefined;
  details: SetItemDetail[];
}
