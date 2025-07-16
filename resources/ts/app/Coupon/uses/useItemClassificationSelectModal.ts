import { useState } from 'react';

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

export const useItemClassificationSelectModal = (): UseItemClassificationSelectModal => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<ItemClassification[]>([]);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  const reset = () => setSelected([]);

  const confirm = (items: ItemClassification[]) => {
    setSelected(items);
    close();
  };

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
