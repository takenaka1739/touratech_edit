import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Receipt, Pager } from '@/types';
import {
  ReceiptListPageConditionState,
  ReceiptListPageActions,
  receiptInitialState,
} from '../modules/receiptListPageModule';
import { useCommonListPage } from '@/app/App/uses/useCommonListPage';

export type ReceiptPageState = {
  rows: Receipt[];
  pager: Pager | undefined;
};

/**
 * 入金データ（一覧）画面用 hooks
 */
export const useReceiptListPage = (slug: string) => {
  const dispatch = useDispatch();
  const initialConditions = receiptInitialState.conditions;

  const setConditions = useCallback(
    (conditions: ReceiptListPageConditionState) =>
      dispatch(ReceiptListPageActions.setConditions(conditions)),
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
  } = useCommonListPage<ReceiptPageState, ReceiptListPageConditionState>(
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
  return useSelector((state: RootState) => state.receiptListPage.conditions);
};
