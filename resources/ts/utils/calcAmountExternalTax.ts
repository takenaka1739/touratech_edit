import toNumber from 'lodash/toNumber';

/**
 * 外税計算
 * 掛率・割引後の金額に消費税をかける
 *
 * @param unitPrice 税抜単価
 * @param quantity 数量
 * @param discount 税抜割引額
 * @param taxRate 消費税率（%）
 * @param fraction 端数処理（1:切捨, 2:四捨五入, 3:切上）
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

  // 消費税（外税）
  const taxRaw = (taxable * taxRate) / 100;

  const sales_tax =
    fraction === 1
      ? Math.floor(taxRaw)
      : fraction === 2
      ? Math.round(taxRaw)
      : Math.ceil(taxRaw);

  // 税込金額
  const amount = taxable + sales_tax;

  return {
    amount,
    sales_tax,
  };
};
