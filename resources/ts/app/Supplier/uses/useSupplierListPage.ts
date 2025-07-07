import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Supplier, Pager } from '@/types';
import {
  SupplierListPageConditionState,
  SupplierListPageActions,
  supplierInitialState,
} from '../modules/supplierListPageModule';
import { useCommonListPage } from '@/app/App/uses/useCommonListPage';

export type SupplierPageState = {
  rows: Supplier[];
  pager: Pager | undefined;
};

/**
 * 仕入先マスタ（一覧）画面用 hooks
 */
export const useSupplierListPage = (slug: string) => {
  const dispatch = useDispatch();
  const initialConditions = supplierInitialState.conditions;

  const setConditions = useCallback(
    (conditions: SupplierListPageConditionState) =>
      dispatch(SupplierListPageActions.setConditions(conditions)),
    [dispatch]
  );

  const getConditions = () => {
    return useSelector((state: RootState) => state.supplierListPage.conditions);
  };

  const {
    isLoading,
    state,
    conditions,
    addDetail,
    onChange,
    onClickSearchButton,
    onClickClearButton,
    onChangePage,
  } = useCommonListPage<SupplierPageState, SupplierListPageConditionState>(
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
    addDetail,
    onChange,
    onClickSearchButton,
    onClickClearButton,
    onChangePage,
  };
};
