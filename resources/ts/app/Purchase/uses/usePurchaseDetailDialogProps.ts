import { useState } from 'react';
import toNumber from 'lodash/toNumber';
import { Item, PurchaseDetail } from '@/types';
import { appAlert } from '@/components';

/**
 * 仕入データ（明細）ダイアログ表示用 hooks
 *
 * @param details
 * @param updateState
 */
export const usePurchaseDetailDialogProps = (
  details: PurchaseDetail[],
  initialDetailState: PurchaseDetail,
  updateDetails: (details: PurchaseDetail[], details_amount: number) => void
) => {
  const [state, setState] = useState<PurchaseDetail>(initialDetailState);
  const [isShown, setIsShown] = useState(false);

  const selectedFuncBefore: (props: Item) => Promise<boolean> = async props => {
    if (props?.id) {
      if (details.findIndex(x => x.item_id === props.id) >= 0) {
        await appAlert('対象の商品は既に選択されています。');
        return false;
      }
    }
    return true;
  };

  const updateDetailState: <K extends keyof PurchaseDetail>(
    props: {
      [key in K]?: PurchaseDetail[K];
    }
  ) => void = props => {
    setState({ ...state, ...props });
  };

  const openDetailDialog = (no: string | undefined, fraction: number) => {
    if (no) {
      const current = details.find(x => x.no === Number(no));
      setState({ ...(current ?? initialDetailState) });
    } else {
      setState({ ...initialDetailState, fraction });
    }
    setIsShown(true);
  };

  const sumAmount: (details: PurchaseDetail[]) => number = details => {
    return details.reduce((x, y) => {
      return x + toNumber(y.amount ?? 0);
    }, 0);
  };

  const onSelected: (detail: PurchaseDetail) => void = detail => {
    if (detail.no) {
      const newDetails = details.map(x => {
        if (x.no === detail.no) {
          return { ...x, ...detail };
        } else {
          return x;
        }
      });
      const details_amount = sumAmount(newDetails);
      updateDetails(sortDetails(newDetails), details_amount);
    } else {
      let newDetails = details;
      details.push({ ...detail, no: newDetails.length + 1 });
      const details_amount = sumAmount(newDetails);
      updateDetails(sortDetails(newDetails), details_amount);
    }
    setIsShown(false);
  };

  const onDeleted: (no: number) => void = no => {
    const newDetails = details.filter(x => x.no !== no);
    const details_amount = sumAmount(newDetails);
    updateDetails(newDetails, details_amount);
    setIsShown(false);
  };

  const sortDetails: (details: PurchaseDetail[]) => PurchaseDetail[] = details => {
    // details.sort((a, b) => {
    //   if ((a.item_number ?? 0) > (b.item_number ?? 0)) {
    //     return 1;
    //   } else {
    //     return -1;
    //   }
    // });
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
