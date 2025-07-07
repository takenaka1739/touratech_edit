import { parse, addDays, addMonths, format, isTuesday, isWednesday, getDay } from 'date-fns';

/**
 * 回答納期を取得する
 *
 * @param receive_order_date 受注日
 * @param domestic_stock 国内在庫
 * @param overseas_stock 国外在庫
 * @returns 回答納期
 */
export const getAnswerDate: (
  receive_order_date: string | undefined,
  domestic_stock: number | undefined,
  overseas_stock: number | undefined
) => string | undefined = (receive_order_date, domestic_stock, overseas_stock) => {
  if (receive_order_date == undefined) {
    return undefined;
  }

  const nextThursday: (date: Date) => Date = date => {
    let delta = 4 - getDay(date);
    if (delta <= 0) delta += 7;
    return addDays(date, delta);
  };

  const addDaysToDate: (days: number) => string = days => {
    let _dt = addDays(parse(receive_order_date, 'yyyy/MM/dd', new Date()), days);
    if (isTuesday(_dt) || isWednesday(_dt)) {
      _dt = nextThursday(_dt);
    }
    return format(_dt, 'yyyy/MM/dd');
  };

  const addMonthsToDate: (months: number) => string = months => {
    let _dt = addMonths(parse(receive_order_date, 'yyyy/MM/dd', new Date()), months);
    if (isTuesday(_dt) || isWednesday(_dt)) {
      _dt = nextThursday(_dt);
    }
    return format(_dt, 'yyyy/MM/dd');
  };

  let _date: string | undefined = undefined;
  if (domestic_stock == undefined || domestic_stock < 0) {
    // NOP
  } else if (domestic_stock > 0) {
    _date = addDaysToDate(3);
  } else if (domestic_stock === 0) {
    if (overseas_stock == undefined || overseas_stock < 0) {
      // NOP
    } else if (overseas_stock > 0) {
      _date = addDaysToDate(7);
    } else if (overseas_stock === 0) {
      _date = addMonthsToDate(3);
    }
  }
  return _date;
};
