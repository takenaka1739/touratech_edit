/**
 * 受注状況
 *
 * @param is_place_order - 発注データが存在する場合true
 */
export type ReceiveOrderStatus = {
  id: number;
  receive_order_detail_id: number;
  receive_order_date: string;
  quantity: number;
  item_number: string | undefined;
  item_name: string | undefined;
  item_name_jp: string | undefined;
  item_kind: number;
  domestic_stock: number;
  customer_name?: string | undefined;
  sales_completed: number;
  place_completed: number;
  answer_date: string | undefined;
};
