/**
 * 商品分類
 *
 * @param id - ID
 * @param is_display - 表示非表示
 * @param code - 商品分類コード
 * @param parent_code - 親の商品分類コード
 * @param name - 商品分類名
 * @param utl - url
 * 
 */
//export interface Category {
//  id: number | undefined;
//  name: string | undefined;
//  remarks: string | undefined;
//}

export interface Category {
  //id: number | undefined;
  //name: string | undefined;
  //remarks: string | undefined;

  id: number | undefined;
  is_display: boolean | undefined;
  code: string | undefined;
  parent_code: string | undefined;
  name: string | undefined;
  url: string | undefined;
}
