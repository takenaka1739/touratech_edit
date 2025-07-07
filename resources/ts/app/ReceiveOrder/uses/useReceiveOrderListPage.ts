import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { ReceiveOrder, Pager } from '@/types';
import {
  ReceiveOrderListPageConditionState,
  ReceiveOrderListPageActions,
  receiveOrderInitialState,
} from '../modules/receiveOrderListPageModule';
import { useCommonListPage } from '@/app/App/uses/useCommonListPage';

export type ReceiveOrderPageState = {
  rows: ReceiveOrder[];
  pager: Pager | undefined;
};

/**
 * 受注詳細一覧画面用 hooks
 */
export const useReceiveOrderListPage = (slug: string) => {
  const dispatch = useDispatch();
  const initialConditions = receiveOrderInitialState.conditions;

  const setConditions = useCallback(
    (conditions: ReceiveOrderListPageConditionState) =>
      dispatch(ReceiveOrderListPageActions.setConditions(conditions)),
    [dispatch]
  );

  const getConditions = () => {
    return useSelector((state: RootState) => state.receiveOrderListPage.conditions);
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
  } = useCommonListPage<ReceiveOrderPageState, ReceiveOrderListPageConditionState>(
    slug,
    {
      rows: [],
      pager: undefined,
    },
    initialConditions,
    getConditions,
    setConditions
  );

  return {
    isLoading,
    state,
    conditions,
    onChange,
    onClickSearchButton,
    onClickClearButton,
    onChangePage,
    addDetail,
  };
};
