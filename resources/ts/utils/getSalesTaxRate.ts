import { Config } from '@/types';
import { parse, parseISO, isValid } from 'date-fns';

/**
 * 消費税率を取得する
 */
export const getSalesTaxRate = (
  date: string | undefined,
  config: Config | undefined
): number => {
  if (!config) {
    return 0;
  }

  const currentRate = config.sales_tax_rate ?? 0;
  const preRate = config.pre_tax_rate ?? 0;
  const changeAt = config.tax_rate_change_at;

  if (!changeAt) {
    return currentRate;
  }

  if (!date) {
    return currentRate;
  }

  const currentDate = parseFlexibleDate(date);
  const changeDate = parseFlexibleDate(changeAt);
  if (!currentDate || !changeDate) {
    return currentRate;
  }

  const result = currentDate >= changeDate ? currentRate : preRate;

  return result;
};

/**
 * yyyy/MM/dd, yyyy-MM-dd, yyyyMMdd, ISO を許容
 */
const parseFlexibleDate = (value: string): Date | null => {
  const s = String(value).trim();
  if (!s) return null;

  const iso = parseISO(s);
  if (isValid(iso)) return iso;

  const slash = parse(s, 'yyyy/MM/dd', new Date());
  if (isValid(slash)) return slash;

  const dash = parse(s, 'yyyy-MM-dd', new Date());
  if (isValid(dash)) return dash;

  const compact = parse(s, 'yyyyMMdd', new Date());
  if (isValid(compact)) return compact;

  return null;
};

/**
 * 開発時のみログ出力
 */
const debugLog = (message: string, payload: any) => {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log(message, payload);
  }
};
