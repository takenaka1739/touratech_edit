import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import axios, { Canceler } from 'axios';
import isEqual from 'lodash/isEqual';
import toNumber from 'lodash/toNumber';
import { Pager } from '@/types';
import { AppActions } from '../modules/appModule';

interface DefaultCondition {
  page: number;
}

interface DefaultData {
  id: number | undefined;
}

/**
 * 検索画面共通 hooks
 */
export const useCommonSearchDialog = <T extends DefaultCondition, U extends DefaultData>(
  initialConditions: T,
  url: string,
  isShown: boolean,
  onSelected: (props: U) => void,
  onCancel: () => void
) => {
  const dispatch = useDispatch();
  const [state, setState] = useState<{
    rows: U[];
    pager: Pager | undefined;
  }>({
    rows: [],
    pager: undefined,
  });
  const [conditions, setConditions] = useState(initialConditions);
  const [isLoading, setIsLoading] = useState(true);
  let cancel: Canceler | null = null;

  useEffect(() => {
    if (isShown) {
      fetch(conditions).then(ret => {
        if (ret) {
          setIsLoading(false);
        }
      });
    }
  }, [isShown]);

  const cleanup: () => void = () => {
    clear(false);
    setIsLoading(true);
  };

  const fetch: <T>(props: T) => Promise<boolean> = async props => {
    if (cancel) {
      cancel();
    }

    dispatch(AppActions.request());
    const res = await axios.post(
      url,
      { ...conditions, ...props },
      {
        cancelToken: new axios.CancelToken(c => {
          cancel = c;
        }),
      }
    );

    if (res) {
      if (res.status === 200) {
        setConditions({ ...conditions, ...props });
        setState(res.data.data);

        dispatch(AppActions.success());
        return true;
      } else {
        dispatch(AppActions.failed('一覧の取得に失敗しました。'));
      }
    }
    return false;
  };

  const clear: (isFetch?: boolean) => void = (isFetch = true) => {
    if (isEqual(initialConditions, conditions)) {
      return;
    }
    if (isFetch) {
      fetch(initialConditions);
    } else {
      setConditions(initialConditions);
    }
  };

  const onChange: (name: string, value: string | number | boolean | undefined) => void = (
    name,
    value
  ) => {
    setConditions({ ...conditions, [name]: value });
  };

  const onClickSearchButton = () => {
    fetch({ page: 1 });
  };

  const onClickClearButton: () => void = () => {
    clear();
  };

  const onChangePage = useCallback(
    (page: number) => {
      if (conditions.page == page) {
        return;
      }

      fetch({ page });
    },
    [conditions.page, fetch]
  );

  const onClickSelect = (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    const id = toNumber(e.currentTarget.dataset.id);
    const row = state.rows.find(x => x.id === id);
    if (row) {
      onSelected(row);
    }
    cleanup();
  };

  const onClickCancel = () => {
    onCancel();
    cleanup();
  };

  return {
    state,
    conditions,
    isLoading,
    setIsLoading,
    setConditions,
    cleanup,
    fetch,
    clear,
    onChange,
    onClickSearchButton,
    onClickClearButton,
    onChangePage,
    onClickSelect,
    onClickCancel,
  };
};
