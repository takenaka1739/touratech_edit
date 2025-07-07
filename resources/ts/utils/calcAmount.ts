import floor from 'lodash/floor';
import ceil from 'lodash/ceil';
import round from 'lodash/round';
import { getSalesTax } from './getSalesTax';
import BigNumber from 'bignumber.js';

/**
 * 金額と消費税（内税）を取得する
 *
 * @param unit_price 単価
 * @param quantity 数量
 * @param sales_tax_rate 消費税率(%)
 * @param fraction 端数処理(1:切り捨て、2:切り上げ、3:四捨五入)
 * @returns {
 *  amount 金額
 *  sales_tax 消費税（内税）
 * }
 */
export const calcAmount: (
  unit_price: number | undefined,
  quantity: number | undefined,
  sales_tax_rate: number,
  fraction: number
) => { amount: number | undefined; sales_tax: number | undefined } = (
  unit_price,
  quantity,
  sales_tax_rate,
  fraction
) => {
  let amount = undefined;
  let sales_tax = undefined;
  if (unit_price !== undefined && quantity !== undefined) {
    let _unit_price = new BigNumber(unit_price ?? 0);
    amount = _unit_price.times(quantity ?? 0).toNumber();
    switch (fraction) {
      case 1:
        amount = floor(amount, 0);
        break;
      case 2:
        amount = ceil(amount, 0);
        break;
      case 3:
        amount = round(amount, 0);
        break;
    }
    sales_tax = getSalesTax(amount, sales_tax_rate, fraction);
  }
  return {
    amount,
    sales_tax,
  };
};
