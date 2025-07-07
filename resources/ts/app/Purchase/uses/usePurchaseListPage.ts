import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Purchase, Pager } from '@/types';
import {
  PurchaseListPageConditionState,
  PurchaseListPageActions,
  purchaseInitialState,
} from '../modules/purchaseListPageModule';
import { useCommonListPage } from '@/app/App/uses/useCommonListPage';

export type PurchasePageState = {
  rows: Purchase[];
  pager: Pager | undefined;
};

/**
 * 仕入データ（一覧）画面用 hooks
 */
export const usePurchaseListPage = (slug: string) => {
  const dispatch = useDispatch();
  const initialConditions = purchaseInitialState.conditions;

  const setConditions = useCallback(
    (conditions: PurchaseListPageConditionState) =>
      dispatch(PurchaseListPageActions.setConditions(conditions)),
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
  } = useCommonListPage<PurchasePageState, PurchaseListPageConditionState>(
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
  return useSelector((state: RootState) => state.purchaseListPage.conditions);
};
