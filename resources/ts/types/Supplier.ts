/**
 * 仕入先
 *
 * @param id - ID
 * @param name - 仕入先名
 * @param zip_code - 郵便番号
 * @param address1 - 住所1
 * @param address2 - 住所2
 * @param tel - TEL
 * @param fax - FAX
 * @param email - MAIL
 * @param foreign_currency_type - 外貨種類
 * @param fraction - 端数処理 1:切り捨て 2:切り上げ 3:四捨五入
 * @param output_no - CSV出力番号
 * @param remarks - 備考
 */
export interface Supplier {
  id: number | undefined;
  name: string | undefined;
  zip_code: string | undefined;
  address1: string | undefined;
  address2: string | undefined;
  tel: string | undefined;
  fax: string | undefined;
  email: string | undefined;
  foreign_currency_type: string | undefined;
  fraction: number | undefined;
  output_no: string | undefined;
  remarks: string | undefined;
}
