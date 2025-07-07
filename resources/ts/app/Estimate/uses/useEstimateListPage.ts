import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Estimate, Pager } from '@/types';
import {
  EstimateListPageConditionState,
  EstimateListPageActions,
  estimateInitialState,
} from '../modules/estimateListPageModule';
import { useCommonListPage } from '@/app/App/uses/useCommonListPage';

export type EstimatePageState = {
  rows: Estimate[];
  pager: Pager | undefined;
};

/**
 * 見積データ（一覧）画面用 hooks
 */
export const useEstimateListPage = (slug: string) => {
  const dispatch = useDispatch();
  const initialConditions = estimateInitialState.conditions;

  const setConditions = useCallback(
    (conditions: EstimateListPageConditionState) =>
      dispatch(EstimateListPageActions.setConditions(conditions)),
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
  } = useCommonListPage<EstimatePageState, EstimateListPageConditionState>(
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
  return useSelector((state: RootState) => state.estimateListPage.conditions);
};
