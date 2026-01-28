import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { useCommonDetailPage } from '@/app/App/uses/useCommonDetailPage';
import { AppActions } from '@/app/App/modules/appModule';
import { useItemSelectModal } from '@/app/Coupon/uses/useItemSelectModal';

/**
 * 注目ランキング（手動制御）詳細で扱う state
 *
 * - 商品コード手入力は廃止 → 商品選択で represent_item_id を必須
 * - item_code / item_name は表示用（選択後に API で解決）
 */
export type PickupRankingDetailState = {
  id: number;

  // 表示用
  item_code: string;
  item_name?: string | null;

  // 実体（保存に必須）
  represent_item_id: number | null;

  is_enabled: boolean;
  manual_priority: number | null;
  memo: string | null;
};

export const usePickupRankingDetailPage = (slug: string) => {
  const dispatch = useDispatch();

  const commonDetail = useCommonDetailPage<PickupRankingDetailState>(slug, {
    id: 0,
    item_code: '',
    item_name: null,
    represent_item_id: null,
    is_enabled: true,
    manual_priority: null,
    memo: null,
  });

  const fetchDetailData = (commonDetail as any).get as (id: number) => Promise<boolean>;

  const {
    isLoading,
    id,
    state,
    errors,
    setErrors,
    isDisabled,
    setState,
    onClickSave: originalSave,
    onClickDelete: originalDelete,
  } = commonDetail;

  // -------------------------
  // 商品検索モーダル（クーポン流用）
  // -------------------------
  const itemModalCore = useItemSelectModal();

  const onOpenItemModal = useCallback(() => {
    // 既に選択済みなら初期選択に反映
    if (state.represent_item_id) {
      itemModalCore.setSelected([state.represent_item_id]);
    } else {
      itemModalCore.setSelected([]);
    }
    itemModalCore.open();
  }, [itemModalCore, state.represent_item_id]);

  const handleConfirmItemModal = useCallback(
    async (ids: number[]) => {
      // 1件運用（複数選択UIでも先頭のみ採用）
      const picked = ids?.[0] ?? null;

      itemModalCore.confirm(ids);

      setState(prev => ({
        ...prev,
        represent_item_id: picked,
        // いったん表示はクリア→API結果で埋める
        item_code: '',
        item_name: null,
      }));

      setErrors((prev: any) => ({
        ...prev,
        represent_item_id: '',
        item_code: '',
      }));

      if (!picked) return;

      // 選択した商品IDから code/name を取得（pickup-ranking 側のAPI）
      try {
        const res = await axios.get(`/api/${slug}/item/${picked}`);
        const d = res.data?.data;
        setState(prev => ({
          ...prev,
          item_code: String(d?.code ?? ''),
          item_name: String(d?.name ?? ''),
        }));
      } catch (e) {
        // 表示のための取得に失敗しても致命ではないが、ユーザーには知らせる
        dispatch(AppActions.failed('選択した商品の情報取得に失敗しました。'));
      }
    },
    [dispatch, itemModalCore, setErrors, setState, slug]
  );

  const itemModal = {
    isOpen: itemModalCore.isOpen,
    selected: itemModalCore.selected,
    close: itemModalCore.close,
    confirm: handleConfirmItemModal,
  };

  /**
   * 保存
   * - represent_item_id 必須
   */
  const onClickSave = useCallback(async () => {
    const validationErrors: any = {};

    if (!state.represent_item_id) {
      validationErrors.represent_item_id = '商品を選択してください';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      dispatch(AppActions.failed('必須項目を入力してください'));
      return;
    }

    try {
      const fixedState: PickupRankingDetailState = {
        ...state,
        represent_item_id:
          state.represent_item_id === null || state.represent_item_id === ('' as any)
            ? null
            : Number(state.represent_item_id),
        manual_priority:
          state.manual_priority === null || state.manual_priority === ('' as any)
            ? null
            : Number(state.manual_priority),
        memo: state.memo ? String(state.memo) : null,
      };

      setState(fixedState);
      await originalSave();
    } catch (error: any) {
      if (error?.response?.status === 422) {
        if (error.response.data?.errors) {
          setErrors(error.response.data.errors);
          return;
        }
        const message = error.response.data?.message;
        dispatch(
          AppActions.failed(
            message ? `データの保存に失敗しました。\n${message}` : 'データの保存に失敗しました。'
          )
        );
        return;
      }

      const message = error?.response?.data?.message;
      dispatch(
        AppActions.failed(message ? `データの保存に失敗しました。\n${message}` : 'データの保存に失敗しました。')
      );
    }
  }, [dispatch, originalSave, setErrors, setState, state]);

  const onClickDelete = useCallback(async () => {
    try {
      await originalDelete();
    } catch (error: any) {
      const message = error?.response?.data?.message;
      dispatch(AppActions.failed(message ? `削除に失敗しました。\n${message}` : '削除に失敗しました。'));
    }
  }, [dispatch, originalDelete]);

  const onChange = useCallback(
    (name: string, value: string | number | boolean | string[] | undefined) => {
      const numberFields = ['manual_priority'];

      setState(prev => ({
        ...prev,
        [name]: numberFields.includes(name) ? (value === '' ? null : value) : value,
      }));

      setErrors((prev: any) => ({
        ...prev,
        [name]: '',
      }));
    },
    [setErrors, setState]
  );

  return {
    isLoading,
    id,
    state,
    errors,
    isDisabled,
    setErrors,
    onChange,
    onClickSave,
    onClickDelete,
    fetchDetailData,

    itemModal,
    onOpenItemModal,
  };
};
