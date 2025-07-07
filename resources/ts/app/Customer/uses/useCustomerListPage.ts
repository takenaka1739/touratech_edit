import { useState } from 'react';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { RootState } from '@/store';
import { Customer, Pager } from '@/types';
import {
  CustomerListPageConditionState,
  CustomerListPageActions,
  customerInitialState,
} from '../modules/customerListPageModule';
import { useCommonListPage } from '@/app/App/uses/useCommonListPage';
import { AppActions } from '@/app/App/modules/appModule';

export type PageState = {
  rows: Customer[];
  pager: Pager | undefined;
};

/**
 * 得意先マスタ（一覧）画面用 hooks
 */
export const useCustomerListPage = (slug: string) => {
  const dispatch = useDispatch();
  const [isDisabled, setDisabled] = useState(false);
  const initialConditions = customerInitialState.conditions;

  const setConditions = useCallback(
    (conditions: CustomerListPageConditionState) =>
      dispatch(CustomerListPageActions.setConditions(conditions)),
    [dispatch]
  );

  const getConditions = () => {
    return useSelector((state: RootState) => state.customerListPage.conditions);
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
  } = useCommonListPage<PageState, CustomerListPageConditionState>(
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

  return {
    isLoading,
    state,
    conditions,
    addDetail,
    onChange,
    onClickSearchButton,
    onClickClearButton,
    onChangePage,
    onClickOutput,
    isDisabled,
  };
};
