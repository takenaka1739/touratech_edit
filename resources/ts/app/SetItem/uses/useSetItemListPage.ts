import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { SetItem, Pager } from '@/types';
import {
  SetItemListPageConditionState,
  SetItemListPageActions,
  setItemInitialState,
} from '@/app/SetItem/modules/setItemListPageModule';
import { useCommonListPage } from '@/app/App/uses/useCommonListPage';

export type SetItemPageState = {
  rows: SetItem[];
  pager: Pager | undefined;
};

/**
 * セット品マスタ（一覧）画面用 hooks
 */
export const useSetItemListPage = (slug: string) => {
  const dispatch = useDispatch();
  const initialConditions = setItemInitialState.conditions;

  const setConditions = useCallback(
    (conditions: SetItemListPageConditionState) =>
      dispatch(SetItemListPageActions.setConditions(conditions)),
    [dispatch]
  );

  const getConditions = () => {
    return useSelector((state: RootState) => state.setItemListPage.conditions);
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
  } = useCommonListPage<SetItemPageState, SetItemListPageConditionState>(
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
