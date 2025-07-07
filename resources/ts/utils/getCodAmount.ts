import { Config } from '@/types';

/**
 * 代引手数料を取得する
 *
 * @param detail_amount 合計金額
 * @param config 設定
 * @returns 代引手数料
 */
export const getCodAmount: (
  detail_amount: number | undefined,
  config: Config | undefined
) => number | undefined = (detail_amount, config) => {
  if (detail_amount === undefined) {
    return undefined;
  }
  if (config != undefined && config.cods != undefined) {
    let _amount = detail_amount ?? 0;
    const _cods = config.cods
      .filter(x => x.border >= _amount)
      .sort((x, y) => {
        if (x.border < y.border) return -1;
        if (x.border > y.border) return 1;
        return 0;
      });
    if (_cods.length > 0) {
      return _cods[0].amount;
    } else {
      return undefined;
    }
  } else {
    return 0;
  }
};
