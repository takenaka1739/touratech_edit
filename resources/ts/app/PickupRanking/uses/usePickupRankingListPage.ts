// 更新: resources/ts/app/PickupRanking/uses/usePickupRankingListPage.ts

import { useCallback, useState } from 'react';
import axios from 'axios';
import { AppActions } from '@/app/App/modules/appModule';
import { useDispatch } from 'react-redux';

type Pager = {
  currentPage: number;
  lastPage: number;
  perPage: number;
  from: number;
  to: number;
  total: number;
};

type PickupRankingRow = any;

type PickupRankingListState = {
  rows: PickupRankingRow[];
  pager: Pager;
};

type PickupRankingListConditions = {
  c_keyword?: string;
  page: number;
};

const initialPager: Pager = {
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  from: 0,
  to: 0,
  total: 0,
};

export const usePickupRankingListPage = (slug: string) => {
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(false);
  const [conditions, setConditions] = useState<PickupRankingListConditions>({
    c_keyword: '',
    page: 1,
  });
  const [state, setState] = useState<PickupRankingListState>({
    rows: [],
    pager: initialPager,
  });

  const onChange = useCallback(
    (name: string, value: string | number | boolean | string[] | undefined) => {
      setConditions(prev => ({
        ...prev,
        [name]: value as any,
      }));
    },
    [],
  );

  const fetchList = useCallback(
    async (cond?: PickupRankingListConditions) => {
      const c = cond ?? conditions;

      setIsLoading(true);
      dispatch(AppActions.request());
      try {
        const res = await axios.post(`/api/${slug}/fetch`, c);
        const data = res.data?.data;

        setState({
          rows: data?.rows ?? [],
          pager: data?.pager ?? initialPager,
        });

        dispatch(AppActions.success());
      } catch (e) {
        console.error('注目ランキング一覧取得エラー:', e);
        dispatch(AppActions.failed('データの取得に失敗しました。'));
      } finally {
        setIsLoading(false);
      }
    },
    [conditions, dispatch, slug],
  );

  const onClickSearchButton = useCallback(() => {
    // 検索時はページを 1 に戻す
    const next = { ...conditions, page: 1 };
    setConditions(next);
    fetchList(next);
  }, [conditions, fetchList]);

  const onClickClearButton = useCallback(() => {
    const next: PickupRankingListConditions = { c_keyword: '', page: 1 };
    setConditions(next);
    fetchList(next);
  }, [fetchList]);

  const onChangePage = useCallback(
    (page: number) => {
      const next = { ...conditions, page };
      setConditions(next);
      fetchList(next);
    },
    [conditions, fetchList],
  );

  const addDetail = useCallback(() => {
    location.href = `/${slug}/detail/new`;
  }, [slug]);

  /**
   * 手動行トグル（idベース）
   * - PV由来は ListPage 側で /toggle-active-by-code を叩く想定
   */
  const onClickToggle = useCallback(
    async (id: number, enable: boolean) => {
      try {
        await axios.post(`/api/${slug}/toggle-active/${id}`, { is_enabled: enable });
        fetchList();
      } catch (e) {
        console.error('状態切り替えエラー:', e);
        dispatch(AppActions.failed('状態の切り替えに失敗しました'));
      }
    },
    [dispatch, fetchList, slug],
  );

  const onClickDeleteManual = useCallback(
    async (id: number) => {
      try {
        await axios.delete(`/api/${slug}/delete/${id}`);
        fetchList();
      } catch (e) {
        console.error('手動行削除エラー:', e);
        dispatch(AppActions.failed('削除に失敗しました'));
        throw e;
      }
    },
    [dispatch, fetchList, slug],
  );

  /**
   * 並び替えは「手動行IDの配列」を送って再採番する前提。
   * - PV由来（pickup_ranking_id が null）や AUTO（is_auto_pv=true）は対象外
   * - A案：優先度廃止 → sort_order の順を正として扱う
   */
  const buildManualIdsInOrder = useCallback((): number[] => {
    const rows = (state.rows || []) as any[];

    // 手動のみ（AUTO除外）に絞る
    const manualRows = rows.filter(r => {
      const id = r?.pickup_ranking_id ?? null;
      const isAutoPv = r?.is_auto_pv === true;
      return id != null && !isAutoPv;
    });

    // sort_order で整列（nullは末尾）
    manualRows.sort((a, b) => {
      const aRaw = a?.sort_order;
      const bRaw = b?.sort_order;

      const aVal = aRaw === null || aRaw === undefined ? Number.MAX_SAFE_INTEGER : Number(aRaw);
      const bVal = bRaw === null || bRaw === undefined ? Number.MAX_SAFE_INTEGER : Number(bRaw);

      if (aVal !== bVal) return aVal - bVal;
      return Number(a?.pickup_ranking_id ?? 0) - Number(b?.pickup_ranking_id ?? 0);
    });

    return manualRows
      .map(r => r.pickup_ranking_id ?? null)
      .filter((v: any) => v != null) as number[];
  }, [state.rows]);

  const sendReorder = useCallback(
    async (manualIds: number[]) => {
      if (manualIds.length === 0) return;
      await axios.post(`/api/${slug}/reorder`, { ids: manualIds });
    },
    [slug],
  );

  const onClickMoveUp = useCallback(
    async (id: number) => {
      try {
        const manualIds = buildManualIdsInOrder();

        const idx = manualIds.findIndex(v => v === id);
        if (idx <= 0) return;

        const next = [...manualIds];
        [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];

        await sendReorder(next);
        fetchList();
      } catch (e) {
        console.error('並び替え（上）エラー:', e);
        dispatch(AppActions.failed('並び替えに失敗しました'));
      }
    },
    [buildManualIdsInOrder, dispatch, fetchList, sendReorder],
  );

  const onClickMoveDown = useCallback(
    async (id: number) => {
      try {
        const manualIds = buildManualIdsInOrder();

        const idx = manualIds.findIndex(v => v === id);
        if (idx < 0 || idx >= manualIds.length - 1) return;

        const next = [...manualIds];
        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];

        await sendReorder(next);
        fetchList();
      } catch (e) {
        console.error('並び替え（下）エラー:', e);
        dispatch(AppActions.failed('並び替えに失敗しました'));
      }
    },
    [buildManualIdsInOrder, dispatch, fetchList, sendReorder],
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

    onClickToggle,
    onClickDeleteManual,
    onClickMoveUp,
    onClickMoveDown,
  };
};
