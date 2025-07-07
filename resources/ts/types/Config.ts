import { ConfigCurrency } from '@/types';
import { ConfigCod } from '@/types';

/**
 * 環境設定
 *
 * @param company_name - 自社名
 * @param zip_code - 郵便番号
 * @param address1 - 住所1
 * @param address2 - 住所2
 * @param tel - TEL
 * @param fax - FAX
 * @param email - MAIL
 * @param company_class - 会社レベル
 * @param bank_name1 - 銀行名①
 * @param branch_name1 - 支店名①
 * @param account_name1 - 口座名①
 * @param account_type1 - 口座種別①
 * @param account_number1 - 口座番号①
 * @param bank_name2 - 銀行名②
 * @param branch_name2 - 支店名②
 * @param account_name2 - 口座名②
 * @param account_type2 - 口座種別②
 * @param account_number2 - 口座番号②
 * @param sales_tax_rate - 消費税率
 * @param pre_tax_rate - 変更前消費税
 * @param tax_rate_change_date - 税率変更日
 * @param send_trader - 送料（業者）
 * @param send_personal - 送料（個人）
 * @param send_price - 送料
 * @param currencies - 通貨換算
 * @param cods - 代引手数料
 */
export interface Config {
  company_name: string | undefined;
  zip_code: string | undefined;
  address1: string | undefined;
  address2?: string | undefined;
  tel: string | undefined;
  fax: string | undefined;
  email: string | undefined;
  company_class: number | undefined;
  company_level: string | undefined;
  bank_name1: string | undefined;
  branch_name1: string | undefined;
  account_name1: string | undefined;
  account_type1: string | undefined;
  account_number1: string | undefined;
  bank_name2: string | undefined;
  branch_name2: string | undefined;
  account_name2: string | undefined;
  account_type2: string | undefined;
  account_number2: string | undefined;
  sales_tax_rate: number | undefined;
  pre_tax_rate: number | undefined;
  tax_rate_change_date: string | undefined;
  send_trader?: number | undefined;
  send_personal?: number | undefined;
  send_price?: number | undefined;
  currencies: ConfigCurrency[];
  cods: ConfigCod[];
}
