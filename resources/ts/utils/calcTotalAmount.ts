import floor from 'lodash/floor';
import ceil from 'lodash/ceil';
import round from 'lodash/round';
import BigNumber from 'bignumber.js';

export const calcTotalAmount: (
  details_amount: number,
  shipping_amount: number,
  fee: number,
  discount: number,
  fraction: number
) => number = (details_aount, shipping_amount, fee, discount, fraction) => {
  let _details_amount = new BigNumber(details_aount);
  let total_amount = _details_amount
    .plus(shipping_amount)
    .plus(fee)
    .minus(discount)
    .toNumber();
  switch (fraction) {
    case 1:
      total_amount = floor(total_amount, 0);
      break;
    case 2:
      total_amount = ceil(total_amount, 0);
      break;
    case 3:
      total_amount = round(total_amount, 0);
      break;
  }
  return total_amount;
};
