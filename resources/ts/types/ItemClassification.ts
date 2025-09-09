/**
 * 商品分類
 *
 * @param id - ID
 * @param name - 商品分類名
 * @param remarks - 備考
 */
export interface ItemClassification {
  id: number | undefined;
  is_display: boolean | undefined;
  code: string | undefined;
  parent_code: string | undefined;
  parent_name: string | undefined;
  name: string | undefined;
  remarks: string | undefined;
  image: string;
  image_id: number | undefined;
}
