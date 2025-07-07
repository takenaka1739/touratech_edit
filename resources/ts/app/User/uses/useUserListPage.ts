import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { User, Pager } from '@/types';
import {
  UserListPageConditionState,
  UserListPageActions,
  userListPageInitialState,
} from '../modules/userListPageModule';
import { useCommonListPage } from '@/app/App/uses/useCommonListPage';

export type UserPageState = {
  rows: User[];
  pager: Pager | undefined;
};

/**
 * 担当者マスタ（一覧）画面用 hooks
 */
export const useUserListPage = (slug: string) => {
  const dispatch = useDispatch();
  const initialConditions = userListPageInitialState.conditions;

  const setConditions = useCallback(
    (conditions: UserListPageConditionState) =>
      dispatch(UserListPageActions.setConditions(conditions)),
    [dispatch]
  );

  const getConditions = () => {
    return useSelector((state: RootState) => state.userListPage.conditions);
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
  } = useCommonListPage<UserPageState, UserListPageConditionState>(
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
