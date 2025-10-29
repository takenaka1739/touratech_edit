import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { RootState } from '@/store';
import { Sales, Pager } from '@/types';
import {
  SalesListPageConditionState,
  SalesListPageActions,
  salesInitialState,
} from '@/app/Sales/modules/salesListPageModule';
import { useCommonListPage } from '@/app/App/uses/useCommonListPage';
import { AppActions } from '@/app/App/modules/appModule';

export type PageState = {
  rows: Sales[];
  pager: Pager | undefined;
};

/**
 * 売上データ（一覧）画面用 hooks
 */
export const useSalesListPage = (slug: string) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const [isDisabled, setDisabled] = useState(false);
  const initialConditions = salesInitialState.conditions;

  const setConditions = useCallback(
    (conditions: SalesListPageConditionState) =>
      dispatch(SalesListPageActions.setConditions(conditions)),
    [dispatch]
  );

  const getConditions = () => useSelector((state: RootState) => state.salesListPage.conditions);

  const {
    isLoading,
    state,
    conditions,
    onChange,
    onClickSearchButton,
    onClickClearButton,
    onChangePage,
    // addDetail は受け取るが、この下で上書きする
  } = useCommonListPage<PageState, SalesListPageConditionState>(
    slug,
    { rows: [], pager: undefined },
    initialConditions,
    getConditions,
    setConditions
  );

  const addDetail = useCallback(() => {
    // ルーティングは /sales/detail（新規） /sales/detail/:id（編集）想定
    history.push(`/${slug}/detail`);
  }, [history, slug]);

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
    onChange,
    onClickSearchButton,
    onClickClearButton,
    onChangePage,
    addDetail,
    onClickOutput,
    isDisabled,
  };
};
