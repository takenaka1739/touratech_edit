import { useState } from 'react';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { RootState } from '@/store';
import { Calendar, Pager } from '@/types';
import {
  CalendarListPageConditionState,
  CalendarListPageActions,
  calendarInitialState,
} from '../modules/calendarListPageModule';
import { useCommonListPage } from '@/app/App/uses/useCommonListPage';
import { AppActions } from '@/app/App/modules/appModule';

export type CalendarPageState = {
  rows: Calendar[];
  pager: Pager | undefined;
};

/**
 * 商品マスタ（一覧）画面用 hooks
 */
export const useCalendarListPage = (slug: string) => {
  const dispatch = useDispatch();
  const [isDisabled, setDisabled] = useState(false);
  const initialConditions = calendarInitialState.conditions;

  const setConditions = useCallback(
    (conditions: CalendarListPageConditionState) =>
      dispatch(CalendarListPageActions.setConditions(conditions)),
    [dispatch]
  );

  const getConditions = () => {
    return useSelector((state: RootState) => state.calendarListPage.conditions);
  };

  const {
    isLoading,
    state,
    conditions,
    onChange,
    onClickSearchButton,
    onClickClearButton,
    onChangePage,
    addDetail,
  } = useCommonListPage<CalendarPageState, CalendarListPageConditionState>(
    slug,
    {
      rows: [],
      pager: undefined,
    },
    initialConditions,
    getConditions,
    setConditions
  );

  const output: () => Promise<boolean> = async () => {
    dispatch(AppActions.request());

    const res = await axios.post(`/api/${slug}/output_excel`, conditions);
    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        const { file_id } = res.data.data;
        const link = document.createElement('a');
        link.href = `/web/${slug}/output_excel/${file_id}`;
        link.click();

        return true;
      }
    } else {
      dispatch(AppActions.failed('出力に失敗しました。'));
    }
    return false;
  };

  const onClickOutput: () => void = async () => {
    setDisabled(true);
    await output();
    setDisabled(false);
  };

  const changeStockDisplay: () => void = async () => {

  };

  return {
    isLoading,
    state,
    conditions,
    onChange,
    onClickSearchButton,
    onClickClearButton,
    onChangePage,
    addDetail,
    onClickOutput,
    changeStockDisplay,
    isDisabled,
  };
};
