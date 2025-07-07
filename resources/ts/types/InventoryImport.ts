/**
 * 棚卸
 */
export interface InventoryImport {
  no: number | undefined;
  import_month: string | undefined;
  item_number: string | undefined;
  item_name: string | undefined;
  quantity: number | undefined;
  stocks: number | undefined;
  unmatch: boolean | undefined;
}
