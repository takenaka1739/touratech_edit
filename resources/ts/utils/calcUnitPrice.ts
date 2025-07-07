import BigNumber from 'bignumber.js';
import floor from 'lodash/floor';
import ceil from 'lodash/ceil';
import round from 'lodash/round';

/**
 * 単価を取得する
 *
 * @param sales_unit_price 売上単価
 * @param rate 掛率(%)
 * @param fraction 端数処理
 * @returns 単価
 */
export const calcUnitPrice: (sales_unit_price: number, rate: number, fraction: number) => number = (
  sales_unit_price,
  rate,
  fraction
) => {
  const _sales_unit_price = new BigNumber(sales_unit_price);
  let unit_price = _sales_unit_price
    .times(rate)
    .div(100)
    .toNumber();

  switch (fraction) {
    case 1:
      unit_price = floor(unit_price, 2);
      break;
    case 2:
      unit_price = ceil(unit_price, 2);
      break;
    case 3:
      unit_price = round(unit_price, 2);
      break;
  }
  return unit_price;
};
