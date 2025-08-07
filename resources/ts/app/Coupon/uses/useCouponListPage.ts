import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import {
  CouponListPageActions,
} from '@/app/Coupon/modules/couponListPageModule';
import { RootState } from '@/store';
import { AppActions } from '@/app/App/modules/appModule';

export const useCouponListPage = (slug: string) => {
  const dispatch = useDispatch();
  const state = useSelector((state: RootState) => state.couponListPage);

  const onChange = useCallback(
    (name: string, value: string | number | boolean | string[] | undefined) => {
      dispatch(
        CouponListPageActions.setConditions({
          ...state.conditions,
          [name]: value,
        })
      );
    },
    [dispatch, state.conditions]
  );

  const fetchList = useCallback(async () => {
    dispatch(CouponListPageActions.setLoading(true));
    try {
      const res = await axios.post('/api/coupon/fetch', state.conditions);
      dispatch(CouponListPageActions.setList(res.data.data));
    } catch (e) {
      console.error('クーポン一覧取得エラー:', e);
    } finally {
      dispatch(CouponListPageActions.setLoading(false));
    }
  }, [dispatch, state.conditions]);

  const onClickSearchButton = useCallback(() => {
    fetchList();
  }, [fetchList]);

  const onClickClearButton = useCallback(() => {
    const newConditions = { c_keyword: '', page: 1 };
    dispatch(CouponListPageActions.setConditions(newConditions));
    dispatch(CouponListPageActions.setLoading(true));
    axios.post('/api/coupon/fetch', newConditions).then(res => {
      dispatch(CouponListPageActions.setList(res.data.data));
    }).catch(e => {
      console.error('リセット検索エラー:', e);
    }).finally(() => {
      dispatch(CouponListPageActions.setLoading(false));
    });
  }, [dispatch]);

  const onChangePage = useCallback(
    (page: number) => {
      const updated = {
        ...state.conditions,
        page,
      };
      dispatch(CouponListPageActions.setConditions(updated));
      dispatch(CouponListPageActions.setLoading(true));
      axios.post('/api/coupon/fetch', updated).then(res => {
        dispatch(CouponListPageActions.setList(res.data.data));
      }).catch(e => {
        console.error('ページ変更エラー:', e);
      }).finally(() => {
        dispatch(CouponListPageActions.setLoading(false));
      });
    },
    [dispatch, state.conditions]
  );

  const addDetail = useCallback(() => {
    location.href = `/${slug}/detail/new`;
  }, [slug]);

  const onClickToggle = useCallback(async (id: number, enable: boolean) => {
    try {
      await axios.post(`/api/coupon/coupon/toggle-active/${id}`, { is_active: enable });
      fetchList();
    } catch (e) {
      console.error('状態切り替えエラー:', e);
      dispatch(AppActions.failed('状態の切り替えに失敗しました'));
    }
  }, [fetchList, dispatch]);

  return {
    isLoading: state.isLoading,
    state,
    conditions: state.conditions,
    addDetail,
    onChange,
    onClickSearchButton,
    onClickClearButton,
    onChangePage,
    onClickToggle,
  };
};
