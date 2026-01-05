import toNumber from 'lodash/toNumber';

/**
 * 外税計算
 * 掛率・割引後の金額に消費税をかける
 *
 * ※ 消費税は常に切り捨て
 */
export const calcAmountExternalTax = (
  unitPrice: number | undefined,
  quantity: number | undefined,
  discount: number | undefined,
  taxRate: number,
  fraction: number
) => {
  const price = toNumber(unitPrice ?? 0);
  const qty = toNumber(quantity ?? 0);
  const disc = toNumber(discount ?? 0);

  // 税抜小計
  const subtotal = price * qty;

  // 割引後税抜（課税対象）
  const taxable = Math.max(subtotal - disc, 0);

  // 消費税（外税・★常に切り捨て）
  const taxRaw = (taxable * taxRate) / 100;
  const sales_tax = Math.floor(taxRaw);

  // 税込金額（こちらは従来通り fraction に従う）
  const amountRaw = taxable + sales_tax;
  const amount =
    fraction === 1
      ? Math.floor(amountRaw)
      : fraction === 2
      ? Math.round(amountRaw)
      : Math.ceil(amountRaw);

  return {
    amount,
    sales_tax,
  };
};
