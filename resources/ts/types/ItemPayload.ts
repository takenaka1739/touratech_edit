import { Item } from '@/types/Item';

export interface ItemPayload extends Item {
  // 画像情報: 各要素は [item_id, fileName1, fileName2, ...] の配列
  images: (number | string)[][];
}