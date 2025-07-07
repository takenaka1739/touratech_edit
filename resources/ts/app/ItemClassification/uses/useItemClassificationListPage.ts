import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { ItemClassification, Pager } from '@/types';
import {
  ItemClassificationListPageConditionState,
  ItemClassificationListPageActions,
  itemClassificationInitialState,
} from '../modules/itemClassificationListPageModule';
import { useCommonListPage } from '@/app/App/uses/useCommonListPage';

export type PageState = {
  rows: ItemClassification[];
  pager: Pager | undefined;
};

/**
 * 商品分類マスタ（一覧）画面用 hooks
 */
export const useItemClassificationListPage = (slug: string) => {
  const dispatch = useDispatch();
  const initialConditions = itemClassificationInitialState.conditions;

  const setConditions = useCallback(
    (conditions: ItemClassificationListPageConditionState) =>
      dispatch(ItemClassificationListPageActions.setConditions(conditions)),
    [dispatch]
  );

  const getConditions = () => {
    return useSelector((state: RootState) => state.itemClassificationListPage.conditions);
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
  } = useCommonListPage<PageState, ItemClassificationListPageConditionState>(
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
