import { useState } from 'react';
import { Item, SetItemDetail } from '@/types';
import { useDialog } from '@/uses/useDialog';
import { appAlert } from '@/components';

export const setItemInitialDetailState: SetItemDetail = {
  set_item_id: undefined,
  id: undefined,
  item_id: undefined,
  item_number: '',
  item_name: '',
  item_name_jp: '',
  quantity: undefined,
  set_price: undefined,
  sales_unit_price: undefined,
};

/**
 * セット品マスタ（明細）ダイアログ表示用 hooks
 *
 * @param details
 * @param updateDetails
 */
export const useSetItemDetailDialogProps = (
  details: SetItemDetail[],
  updateDetails: (details: SetItemDetail[]) => void
) => {
  const [state, setState] = useState<SetItemDetail>(setItemInitialDetailState);
  const [isShown, open, close] = useDialog(false);

  const selectedFuncBefore: (props: Item) => Promise<boolean> = async props => {
    if (props?.id) {
      if (details.findIndex(x => x.item_id === props.id) >= 0) {
        await appAlert('対象の商品は既に選択されています。');
        return false;
      }
    }
    return true;
  };

  const updateDetailState: <K extends keyof SetItemDetail>(
    props: {
      [key in K]?: SetItemDetail[K];
    }
  ) => void = props => {
    setState({ ...state, ...props });
  };

  const openDetailDialog = (id: string | undefined) => {
    if (id) {
      const current = details.find(x => x.id === Number(id));
      setState(current ?? setItemInitialDetailState);
    } else {
      setState(setItemInitialDetailState);
    }
    open();
  };

  const onSelected: (detail: SetItemDetail) => void = detail => {
    if (detail.id) {
      const newDetails = details.map(x => {
        if (x.id === detail.id) {
          return { ...x, ...detail };
        } else {
          return x;
        }
      });
      updateDetails(newDetails);
    } else {
      let newDetails = details;
      details.push({ ...detail, id: newDetails.length + 1 });
      updateDetails(newDetails);
    }
    close();
  };

  const onDeleted: (id: number) => void = id => {
    const newDetails = details
      .filter(x => x.id !== id)
      .map((x, i) => {
        return { ...x, id: i + 1 };
      });
    updateDetails(newDetails);
    close();
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
      onCancel: () => close(),
    },
  };
};
