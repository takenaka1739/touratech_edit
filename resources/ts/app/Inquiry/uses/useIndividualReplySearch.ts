import { useCommonSearchDialogProps } from '@/app/App/uses/useCommonSearchDialogProps';
import { Item } from '@/types';
import { useState } from 'react';

export const useIndividualReplySearch = <T>(initialState: T) => {

  const [state, setState] = useState<T>(initialState);

  const {
    open: openIndividualReplyDialog,
    searchDialogProps: individualReplyDialogProps,
  } = useCommonSearchDialogProps<Item>(
    'item',
    async ({ id }) => {
      // 他商品情報参照で選択された商品の ID を state に反映
      setState((prev: any) => ({
        ...prev,
        ref_item_id: id,
      }));
      return true;
    }
  );

  const onChangeRefState = (value: any) => {
    setState((prev: any) => ({
      ...prev,
      ...value,
    }));
  };

  return {
    state,
    openIndividualReplyDialog,
    individualReplyDialogProps,
    onChangeRefState,
  };
};
