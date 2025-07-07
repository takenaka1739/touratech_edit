/**
 * 発送予定
 *
 * @param id - ID
 * @param shipment_plan_date - 到着予定日
 * @param item_number - 品番
 * @param name - 商品名
 * @param unit_price - 単価
 * @param quantity - 数量
 * @param amount - 金額
 */
export type ShipmentPlan = {
  id: number | undefined;
  shipment_plan_date: string;
  item_number: string;
  name: string;
  unit_price: number;
  quantity: number;
  amount: number;
};
