// 更新: resources/ts/app/App/uses/useCommonDataDetailDialogProps.ts
import { useState } from 'react';
import toNumber from 'lodash/toNumber';
import { Item, CommonDataDetail } from '@/types';
import { appAlert } from '@/components';

/**
 * データ（明細）ダイアログ表示共通 hooks
 *
 * @param details
 * @param updateState
 */
export const useCommonDataDetailDialogProps = <T extends CommonDataDetail>(
  details: T[],
  initialDetailState: T,
  updateDetails: <U>(details: U[], details_amount: number) => void
) => {
  const [state, setState] = useState<T>(initialDetailState);
  const [isShown, setIsShown] = useState(false);

  const selectedFuncBefore: (props: Item) => Promise<boolean> = async props => {
    if (props?.id) {
      if (state.item_id !== props.id && details.findIndex(x => x.item_id === props.id) >= 0) {
        await appAlert('対象の商品は既に選択されています。');
        return false;
      }
    }
    return true;
  };

  const updateDetailState: <K extends keyof T>(
    props: {
      [key in K]?: T[K];
    }
  ) => void = props => {
    setState({ ...state, ...props });
  };

  /**
   * ★追加：明細stateを安全に正規化（discountの補完など）
   */
  const normalizeDetail = (src: T): T => {
    return {
      ...src,
      // discountが未設定なら0
      discount: (src.discount ?? 0) as any,
    };
  };

  const openDetailDialog = (no: string | undefined, rate: number, fraction: number) => {
    if (no) {
    const current = details.find(x => x.no === Number(no));
    setState(current ?? initialDetailState);
  } else {
    setState({ ...initialDetailState, rate, fraction });
  }
  setIsShown(true);
};

  const sumAmount: (details: T[]) => number = details => {
    return details.reduce((x, y) => {
      return x + toNumber(y.amount ?? 0);
    }, 0);
  };

  const onSelected: (detail: T) => void = detail => {
    // ★保存反映時もdiscountを補完してから取り込む
    const normalized = normalizeDetail(detail);

    if (normalized.no) {
      const newDetails = details.map(x => {
        if (x.no === normalized.no) {
          return { ...x, ...normalized };
        } else {
          return { ...x };
        }
      });
      const details_amount = sumAmount(newDetails);
      updateDetails(sortDetails(newDetails), details_amount);
    } else {
      const newDetails = [...details];
      newDetails.push({ ...normalized, no: newDetails.length + 1 });
      const details_amount = sumAmount(newDetails);
      updateDetails(sortDetails(newDetails), details_amount);
    }
    setIsShown(false);
  };

  const onDeleted: (no: number) => void = no => {
    const newDetails = details.filter(x => x.no !== no);
    const details_amount = sumAmount(newDetails);
    updateDetails(sortDetails(newDetails), details_amount);
    setIsShown(false);
  };

  const sortDetails: (details: T[]) => T[] = details => {
    return details.map((x, i) => {
      return { ...x, no: i + 1 };
    });
  };

  return {
    open: openDetailDialog,
    detailDialogProps: {
      isShown,
      state,
      selectedFuncBefore,
      updateState: updateDetailState,
      onSelected,
      onDeleted,
      onCancel: () => setIsShown(false),
    },
  };
};
