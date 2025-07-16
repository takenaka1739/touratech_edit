import { useState, useCallback } from 'react';

/**
 * 商品選択モーダル用のカスタムフック
 */
export const useItemSelectModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);

  const openModal = useCallback((initialSelected: number[] = []) => {
    setSelectedItemIds(initialSelected);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const updateSelectedItems = useCallback((ids: number[]) => {
    setSelectedItemIds(ids);
  }, []);

  return {
    isModalOpen,
    selectedItemIds,
    openModal,
    closeModal,
    updateSelectedItems,
  };
};
