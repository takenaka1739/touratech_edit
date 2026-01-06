import axios from 'axios';
import { AppActions } from '@/app/App/modules/appModule';

type UseItemPrintArgs = {
  state: any;
  slug: string;
  dispatch: any;
  updateState: (value: any) => void;
};

/**
 * 商品マスタの「印刷・ラベル選択」用フックス。
 * 
 * - ラベル選択
 * - 印刷処理
 * - 依存関係
 */
export const useItemPrint = ({ state, slug, dispatch, updateState }: UseItemPrintArgs) => {
  // ==============================================================
  // ラベル選択
  // ==============================================================
  const onSelected = (no: number) => {
    let selected: number[] = [];

    if (state.selected?.includes(no)) {
      selected = state.selected.filter((i: number) => i !== no);
    } else {
      selected = state.selected ?? [];
      selected.push(no);
    }

    updateState({ selected });
  };

  // ==============================================================
  // 印刷（価格あり）
  // ==============================================================
  const onClickPrint = async () => {
    dispatch(AppActions.request());

    const res = await axios.post(`/api/${slug}/output`, {
      ...state,
      isPrintPrice: true,
    });

    if (res.status === 200) {
      dispatch(AppActions.success());

      if (res.data.success) {
        const { file_id } = res.data.data;

        const link = document.createElement('a');
        link.href = `/web/${slug}/output/${file_id}`;
        link.target = '_blank';
        link.click();

        return true;
      }
    } else {
      dispatch(AppActions.failed('出力に失敗しました。'));
    }

    return false;
  };

  // ==============================================================
  // 印刷（価格なし）
  // ==============================================================
  const onClickPrintNoPrice = async () => {
    dispatch(AppActions.request());

    const res = await axios.post(`/api/${slug}/output`, {
      ...state,
      isPrintPrice: false,
    });

    if (res.status === 200) {
      dispatch(AppActions.success());

      if (res.data.success) {
        const { file_id } = res.data.data;

        const link = document.createElement('a');
        link.href = `/web/${slug}/output/${file_id}`;
        link.target = '_blank';
        link.click();

        return true;
      }
    } else {
      dispatch(AppActions.failed('出力に失敗しました。'));
    }

    return false;
  };

  return {
    onSelected,
    onClickPrint,
    onClickPrintNoPrice,
  };
};
