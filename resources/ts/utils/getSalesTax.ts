import floor from 'lodash/floor';
import ceil from 'lodash/ceil';
import round from 'lodash/round';

/**
 * 消費税（内税）を取得する
 *
 * @param amount 金額
 * @param rate 税率(%)
 * @param fraction 端数処理(1:切り捨て、2:切り上げ、3:四捨五入)
 * @returns 消費税（内税）
 */
export const getSalesTax: (amount: number, rate: number, fraction: number | undefined) => number = (
  amount,
  rate,
  fraction
) => {
  const _amount = (amount * rate) / (100 + rate);
  switch (fraction) {
    case 1:
      return floor(_amount, 0);
    case 2:
      return ceil(_amount, 0);
    case 3:
      return round(_amount, 0);
    default:
      return 0;
  }
};
