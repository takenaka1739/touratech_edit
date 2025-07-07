import { useState } from 'react';
import { InventoryImport } from '@/types';

const initialDetailState: InventoryImport = {
  no: undefined,
  import_month: undefined,
  item_number: undefined,
  item_name: undefined,
  quantity: undefined,
  stocks: undefined,
  unmatch: undefined,
};

export const useInventoryImportDetailDialogProps = (
  details: InventoryImport[],
  updateDetails: (details: InventoryImport[]) => void
) => {
  const [state, setState] = useState<InventoryImport>(initialDetailState);
  const [isShown, setIsShown] = useState(false);

  const updateDetailState: <K extends keyof InventoryImport>(
    props: {
      [key in K]?: InventoryImport[K];
    }
  ) => void = props => {
    setState({ ...state, ...props });
  };

  const openDetailDialog = (no: string | undefined) => {
    if (no) {
      const current = details.find(x => x.no === Number(no));
      setState({ ...(current ?? initialDetailState) });
    } else {
      setState({ ...initialDetailState });
    }
    setIsShown(true);
  };

  const onSave = () => {
    const newDetails = details.map(x => {
      if (x.no === state.no) {
        return { ...x, ...state };
      } else {
        return x;
      }
    });
    updateDetails(newDetails);
    setIsShown(false);
  };

  return {
    open: openDetailDialog,
    detailDialogProps: {
      isShown,
      state,
      updateState: updateDetailState,
      onSave,
      onCancel: () => setIsShown(false),
    },
  };
};
