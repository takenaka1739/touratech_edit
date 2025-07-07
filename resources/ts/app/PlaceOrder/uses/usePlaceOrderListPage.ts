import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { PlaceOrder, Pager } from '@/types';
import {
  PlaceOrderListPageConditionState,
  PlaceOrderListPageActions,
  placeOrderInitialState,
} from '../modules/placeOrderListPageModule';
import { useCommonListPage } from '@/app/App/uses/useCommonListPage';

export type PlaceOrderPageState = {
  rows: PlaceOrder[];
  pager: Pager | undefined;
};

/**
 * 発注データ（一覧）画面用 hooks
 */
export const usePlaceOrderListPage = (slug: string) => {
  const dispatch = useDispatch();
  const initialConditions = placeOrderInitialState.conditions;

  const setConditions = useCallback(
    (conditions: PlaceOrderListPageConditionState) =>
      dispatch(PlaceOrderListPageActions.setConditions(conditions)),
    [dispatch]
  );

  const {
    isLoading,
    state,
    conditions,
    onChange,
    onClickSearchButton,
    onClickClearButton,
    onChangePage,
    addDetail,
  } = useCommonListPage<PlaceOrderPageState, PlaceOrderListPageConditionState>(
    slug,
    {
      rows: [],
      pager: undefined,
    },
    initialConditions,
    useConditions,
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

export const useConditions = () => {
  return useSelector((state: RootState) => state.placeOrderListPage.conditions);
};
