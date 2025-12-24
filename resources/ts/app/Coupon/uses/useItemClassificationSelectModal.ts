import { useState, useCallback } from 'react';

export type ItemClassification = {
  id: number;
  name: string;
  code?: string;
};

type UseItemClassificationSelectModal = {
  isOpen: boolean;
  selected: ItemClassification[];
  open: () => void;
  close: () => void;
  confirm: (items: ItemClassification[]) => void;
  reset: () => void;
  setSelected: (items: ItemClassification[]) => void;
};

/**
 * 商品分類選択モーダル用のカスタムフック
 */
export const useItemClassificationSelectModal = (): UseItemClassificationSelectModal => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<ItemClassification[]>([]);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const reset = useCallback(() => {
    setSelected([]);
  }, []);

  const confirm = useCallback(
    (items: ItemClassification[]) => {
      setSelected(items);
      close();
    },
    [close]
  );

  return {
    isOpen,
    selected,
    open,
    close,
    confirm,
    reset,
    setSelected,
  };
};
