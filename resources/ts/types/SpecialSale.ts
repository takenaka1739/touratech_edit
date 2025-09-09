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
export type SpecialSale = {
    id: number | undefined;
    item_id: number | undefined;
    is_sales_members_only:boolean | undefined ;
    start_at: string | undefined;
    end_at: string | undefined;
    special_sale_price: number | undefined ;
    refund_rate:number | undefined ;
};
