import toNumber from 'lodash/toNumber';
import toString from 'lodash/toString';

/**
 * 数値をカンマ区切りにする
 *
 * @param num 入力値
 * @param digits 少数の桁数
 * @returns フォーマットされた数値文字列
 */
export const numberFormat: (num: number | string | undefined, digits?: number) => string = (
  num,
  digits = 2
) => {
  if (num != undefined) {
    return toNumber(toString(num)).toLocaleString(undefined, {
      minimumFractionDigits: digits,
    });
  } else {
    return '';
  }
};
