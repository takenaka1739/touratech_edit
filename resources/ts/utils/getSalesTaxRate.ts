import { Config } from '@/types';
import { parse } from 'date-fns';

/**
 * 消費税率を取得する
 * 日付が税率変更日より前の場合は変更前税率、以降の場合は現在の消費税率を取得
 *
 * @param date 日付
 * @param config 設定
 * @returns 消費税率(%)
 */
export const getSalesTaxRate: (date: string | undefined, config: Config | undefined) => number = (
  date,
  config
) => {
  if (config != undefined && config.tax_rate_change_date != undefined) {
    if (date) {
      const currentDate = parse(date, 'yyyy/MM/dd', new Date());
      const changeDate = parse(config.tax_rate_change_date, 'yyyy/MM/dd', new Date());

      if (currentDate >= changeDate) {
        return config.sales_tax_rate ?? 0;
      } else {
        return config.pre_tax_rate ?? 0;
      }
    } else {
      return config.sales_tax_rate ?? 0;
    }
  } else {
    return 0;
  }
};
