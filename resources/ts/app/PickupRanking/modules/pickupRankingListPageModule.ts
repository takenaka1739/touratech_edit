import { actionCreatorFactory } from 'typescript-fsa';
import { reducerWithInitialState } from 'typescript-fsa-reducers';
import { Pager } from '@/types/Pager';

const create = actionCreatorFactory();

/**
 * 注目ランキング（一覧）で扱う行データ
 * - 取得元は「PV + 手動制御合成」の一覧APIを想定
 * - クーポンの Coupon 型と同じ考えで、最小限の型をここで定義
 */
export type PickupRankingRow = {
  // 手動制御テーブルのID（手動行のみ入る想定）
  pickup_ranking_id?: number | null;

  // 表示単位（code）
  item_code: string;

  // 表示用代表商品の情報
  represent_item_id?: number | null;
  item_name: string;

  // PV
  pv_count?: number | null;

  // 手動制御
  is_enabled?: boolean;
  force_display?: boolean;
  manual_priority?: number | null;
  start_at?: string | null;
  end_at?: string | null;
  memo?: string | null;

  // 一覧UI用
  can_delete?: boolean; // 手動登録分のみ true（PV由来は false）
};

/** 注目ランキング一覧の検索条件 */
export type PickupRankingListPageConditionState = {
  c_keyword?: string;
  page: number;

  // 将来の拡張用（必要になったら使う）
  // include_disabled?: boolean;
  // limit?: number;
};

/** 注目ランキング一覧画面の状態全体 */
export type PickupRankingListPageState = {
  conditions: PickupRankingListPageConditionState;
  isLoading: boolean;
  rows: PickupRankingRow[];
  pager: Pager;
};

/** 初期状態 */
export const pickupRankingListInitialState: PickupRankingListPageState = {
  conditions: {
    c_keyword: '',
    page: 1,
  },
  isLoading: false,
  rows: [],
  pager: {
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    from: 1,
    to: 1,
    total: 0,
  },
};

/** アクション定義（クーポンと同型） */
export const PickupRankingListPageActions = {
  setConditions: create<PickupRankingListPageConditionState>('PICKUP_RANKING_LIST_PAGE_SET_CONDITIONS'),
  setLoading: create<boolean>('PICKUP_RANKING_LIST_PAGE_SET_LOADING'),
  setList: create<{ rows: PickupRankingRow[]; pager: Pager }>('PICKUP_RANKING_LIST_PAGE_SET_LIST'),
  updateConditions: create<{ name: string; value: any }>('PICKUP_RANKING_LIST_PAGE_UPDATE_CONDITIONS'),
};

/** リデューサ定義 */
export const PickupRankingListPageReducer = reducerWithInitialState(pickupRankingListInitialState)
  .case(PickupRankingListPageActions.setConditions, (state, conditions) => ({
    ...state,
    conditions,
  }))
  .case(PickupRankingListPageActions.setLoading, (state, isLoading) => ({
    ...state,
    isLoading,
  }))
  .case(PickupRankingListPageActions.setList, (state, payload) => ({
    ...state,
    rows: payload.rows,
    pager: payload.pager,
  }))
  .case(PickupRankingListPageActions.updateConditions, (state, { name, value }) => ({
    ...state,
    conditions: {
      ...state.conditions,
      [name]: value,
    },
  }));
