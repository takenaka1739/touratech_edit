import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import isEqual from 'lodash/isEqual';
import { RootState } from '@/store';
import { ReceiveOrderStatus, Pager } from '@/types';
import {
  receiveOrderStatusInitialState,
  ReceiveOrderStatusListPageConditionState,
  ReceiveOrderStatusListPageActions,
} from '../modules/receiveOrderStatusListPageModule';
import { AppActions } from '@/app/App/modules/appModule';

/**
 * 受注状況一覧画面用 hooks
 */
export const useReceiveOrderStatusListPage = (slug: string) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [state, setState] = useState<{
    rows: ReceiveOrderStatus[];
    pager: Pager | undefined;
  }>({
    rows: [],
    pager: undefined,
  });
  const conditions = useConditions();
  const initialConditions = receiveOrderStatusInitialState.conditions;

  const setConditions = useCallback(
    (conditions: ReceiveOrderStatusListPageConditionState) =>
      dispatch(ReceiveOrderStatusListPageActions.setConditions(conditions)),
    [dispatch]
  );

  useEffect(() => {
    fetch(conditions).then(ret => {
      if (ret) {
        setIsLoading(false);
      }
    });
  }, []);

  const fetch: (
    props: ReceiveOrderStatusListPageConditionState
  ) => Promise<boolean> = async props => {
    dispatch(AppActions.request());
    const res = await axios.post(`/api/${slug}/fetch`, { ...conditions, ...props });

    if (res.status === 200) {
      setConditions({ ...conditions, ...props });
      setState(res.data.data);

      dispatch(AppActions.success());
      return true;
    } else {
      dispatch(AppActions.failed('一覧の取得に失敗しました。'));
    }
    return false;
  };

  const clear: () => void = () => {
    if (isEqual(initialConditions, conditions)) {
      return;
    }

    fetch(initialConditions);
  };

  const onChange: (name: string, value: string | number | boolean | undefined) => void = (
    name,
    value
  ) => {
    setConditions({ ...conditions, [name]: value });
  };

  const onClickSearchButton: () => void = () => {
    fetch({ page: 1 });
  };

  const onClickClearButton: () => void = () => {
    clear();
  };

  return {
    isLoading,
    state,
    conditions,
    onChange,
    onClickSearchButton,
    onClickClearButton,
  };
};

export const useConditions = () => {
  return useSelector((state: RootState) => state.receiveOrderStatusListPage.conditions);
};
