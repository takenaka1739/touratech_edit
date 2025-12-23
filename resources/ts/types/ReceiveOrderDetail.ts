export interface CommonDataDetail {
  id: number | undefined;
  no: number | undefined;
  item_kind: number | undefined;
  item_id: number | undefined;
  item_number: string | undefined;
  item_name: string | undefined;
  item_name_jp: string | undefined;
  sales_unit_price: number | undefined;
  rate: number;
  unit_price: number | undefined;
  quantity: number | undefined;
  discount?: number | undefined;
  amount: number | undefined;
  sales_tax_rate: number | undefined;
  sales_tax: number | undefined;
  fraction: number;
  answer_date?: string | undefined;
}
