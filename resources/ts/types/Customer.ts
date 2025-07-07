/**
 * 得意先
 *
 * @param id - ID
 * @param name - 得意先名
 * @param kana - カナ
 * @param zip_code - 郵便番号
 * @param address1 - 住所1
 * @param address2 - 住所2
 * @param tel - TEL
 * @param fax - FAX
 * @param email - MAIL
 * @param fraction - 端数処理 1:切り捨て 2:切り上げ 3:四捨五入
 * @param corporate_class - 支払方法 1:現金、2:掛売、3:宅配代引、4:銀行振込、5:クレジットカード
 * @param bank_class - 口座選択 1:銀行1、2:銀行2
 * @param cutoff_date - 締日
 * @param rate - 掛率
 * @param remarks - 備考
 */
export interface Customer {
  id: number | undefined;
  name: string | undefined;
  kana: string | undefined;
  zip_code: string | undefined;
  address1: string | undefined;
  address2: string | undefined;
  tel: string | undefined;
  fax: string | undefined;
  email: string | undefined;
  fraction: number | undefined;
  corporate_class: number | undefined;
  bank_class: number | undefined;
  cutoff_date: number | undefined;
  rate: number | undefined;
  remarks: string | undefined;
}
