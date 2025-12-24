import { useState, useCallback } from 'react';

/**
 * 商品選択モーダル用のカスタムフック
 */
export const useItemSelectModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const setSelected = useCallback((ids: number[]) => {
    setSelectedIds(ids);
  }, []);

  const confirm = useCallback(
    (ids: number[]) => {
      setSelectedIds(ids);
      close();
    },
    [close]
  );

  const reset = useCallback(() => {
    setSelectedIds([]);
  }, []);

  return {
    isOpen,
    selected: selectedIds,
    open,
    close,
    confirm,
    reset,
    setSelected,
  };
};


