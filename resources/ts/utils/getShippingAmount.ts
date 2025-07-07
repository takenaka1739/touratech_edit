import { Config } from '@/types';

/**
 * 送料を取得する
 *
 * @param detail_amount 合計金額
 * @param rate 掛率
 * @param config 設定
 * @returns 送料
 */
export const getShippingAmount: (
  detail_amount: number | undefined,
  rate: number | undefined,
  config: Config | undefined
) => number | undefined = (detail_amount, rate, config) => {
  if (detail_amount === undefined) {
    return undefined;
  }
  if (config != undefined && rate != undefined) {
    const _amount = rate === 100 ? config.send_personal ?? 0 : config.send_trader ?? 0;
    if (_amount > detail_amount) {
      return config.send_price ?? 0;
    }
  }
  return 0;
};
