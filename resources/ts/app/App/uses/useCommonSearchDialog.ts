// 更新: resources/ts/app/App/uses/useCommonSearchDialog.ts
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

    // ここは find が number 比較なので id 型は OK（toNumber済み）
    const row = state.rows.find(x => x.id === id);

    // ★デバッグ：object を文字列連結しない（必ず [object Object] になるため）
    console.log('[useCommonSearchDialog] selected id', id);
    console.log('[useCommonSearchDialog] row found?', !!row);

    if (row) {
      const r: any = row as any;
      console.log('[useCommonSearchDialog] row raw', row);
      console.log('[useCommonSearchDialog] row keys', Object.keys(r));

      // ★品番・在庫のキー揺れ候補を出す（原因特定用）
      console.log('[useCommonSearchDialog] item_number candidates', {
        item_number: r.item_number,
        itemNo: r.itemNo,
        item_no: r.item_no,
        code: r.code,
      });
      console.log('[useCommonSearchDialog] stock candidates', {
        domestic_stocks: r.domestic_stocks,
        domestic_stock: r.domestic_stock,
        overseas_stocks: r.overseas_stocks,
        overseas_stock: r.overseas_stock,
      });

      onSelected(row);
    } else {
      console.warn('[useCommonSearchDialog] row not found', {
        id,
        rows_len: state.rows.length,
        sample_ids: (state.rows as any[]).slice(0, 5).map(x => x?.id),
      });
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
