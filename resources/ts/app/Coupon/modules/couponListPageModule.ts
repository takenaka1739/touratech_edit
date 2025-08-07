import { actionCreatorFactory } from 'typescript-fsa';
import { reducerWithInitialState } from 'typescript-fsa-reducers';
import { Pager } from '@/types/Pager';

const create = actionCreatorFactory();

/** Coupon 型はすでに types/Coupon.ts にあるため import */
import { Coupon } from '@/types/Coupon';

/** クーポン一覧の検索条件 */
export type CouponListPageConditionState = {
  c_keyword?: string;
  page: number;
};

/** クーポン一覧画面の状態全体 */
export type CouponListPageState = {
  conditions: CouponListPageConditionState;
  isLoading: boolean;
  rows: Coupon[];
  pager: Pager;
};

/** 初期状態 */
export const couponListInitialState: CouponListPageState = {
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

/** アクション定義 */
export const CouponListPageActions = {
  setConditions: create<CouponListPageConditionState>('COUPON_LIST_PAGE_SET_CONDITIONS'),
  setLoading: create<boolean>('COUPON_LIST_PAGE_SET_LOADING'),
  setList: create<{ rows: Coupon[]; pager: Pager }>('COUPON_LIST_PAGE_SET_LIST'),
  updateConditions: create<{ name: string; value: any }>('COUPON_LIST_PAGE_UPDATE_CONDITIONS'),
};

/** リデューサ定義 */
export const CouponListPageReducer = reducerWithInitialState(couponListInitialState)
  .case(CouponListPageActions.setConditions, (state, conditions) => ({
    ...state,
    conditions,
  }))
  .case(CouponListPageActions.setLoading, (state, isLoading) => ({
    ...state,
    isLoading,
  }))
  .case(CouponListPageActions.setList, (state, payload) => ({
    ...state,
    rows: payload.rows,
    pager: payload.pager,
  }))
  .case(CouponListPageActions.updateConditions, (state, { name, value }) => ({
  ...state,
  conditions: {
    ...state.conditions,
    [name]: value,
  },
}));
