import { Item } from '@/types/Item';

export interface ItemPayload extends Item {
  variations: {
    id: number | null;
    variations1: string;
    variations2: string;
    variations3: string;
    variations4: string;
    item_number: string;
    sales_price: number;
  }[];
}