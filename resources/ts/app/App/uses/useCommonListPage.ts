import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import axios, { Canceler } from 'axios';
import isEqual from 'lodash/isEqual';
import { AppActions } from '@/app/App/modules/appModule';
import { Action } from 'typescript-fsa';

interface ListPage {
  page: number;
}

/**
 * 一覧画面共通 hooks
 */
export const useCommonListPage = <T, U extends ListPage>(
  slug: string,
  initialState: T,
  initialConditions: U,
  getConditions: () => U,
  setConditions: (conditions: U) => Action<U>
) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const [state, setState] = useState<T>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const conditions = getConditions();
  let cancel: Canceler | null = null;

  const addDetail = useCallback(() => history.push(`/${slug}/detail`), [slug]);

  const updateConditions: <K extends keyof U>(
    porps: {
      [key in K]?: U[K];
    }
  ) => void = props => {
    setConditions({ ...conditions, ...props });
  };

  useEffect(() => {
    fetch(conditions).then(ret => {
      if (ret) {
        setIsLoading(false);
      }
    });
  }, []);

  const fetch: <U>(props: U) => Promise<boolean> = async props => {
    if (cancel) {
      cancel();
    }

    dispatch(AppActions.request());
    const res = await axios.post(
      `/api/${slug}/fetch`,
      { ...conditions, ...props },
      {
        cancelToken: new axios.CancelToken(c => {
          cancel = c;
        }),
      }
    );

    if (res) {
      if (res.status === 200) {
        dispatch(AppActions.success());
        setConditions({ ...conditions, ...props });
        setState(res.data.data);
        return true;
      } else {
        dispatch(AppActions.failed('一覧の取得に失敗しました。'));
      }
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

  const onChangePage = useCallback(
    (page: number) => {
      if (conditions.page == page) {
        return;
      }

      fetch({ page });
    },
    [conditions.page, fetch]
  );

  const onClickClearButton: () => void = () => {
    clear();
  };

  return {
    isLoading,
    state,
    conditions,
    updateConditions,
    addDetail,
    onChange,
    onClickSearchButton,
    onClickClearButton,
    onChangePage,
  };
};
