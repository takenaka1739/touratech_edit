import { Item } from '@/types/Item';

export interface ItemPayload extends Item {
  // 画像情報: 各要素は [item_id, fileName1, fileName2, ...] の配列
  images: string[][];
  // 共通画像: 同一商品コードの全バリエーションで表示する画像
  commonImages?: string[];
}
