import { useCommonSearchDialogProps } from '@/app/App/uses/useCommonSearchDialogProps';
import { Item } from '@/types';

type UseItemRefSearchArgs = {
  setState: React.Dispatch<React.SetStateAction<any>>;
};

export const useItemRefSearch = ({ setState }: UseItemRefSearchArgs) => {
  const {
    open: openItemRefDialog,
    searchDialogProps: itemRefSearchDialogProps,
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
    openItemRefDialog,
    itemRefSearchDialogProps,
    onChangeRefState,
  };
};
