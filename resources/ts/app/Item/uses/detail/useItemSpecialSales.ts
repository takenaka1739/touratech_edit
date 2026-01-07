import { useState } from 'react';
import { SpecialSale } from '@/types';

type UseItemSpecialSalesArgs = {
  setState: React.Dispatch<React.SetStateAction<any>>;
};

/**
 * 商品マスタの「特売設定」用フックス。
 * 
 * - ダイアログ表示状態
 * - ダイアログを開く
 * - ダイアログを閉じる
 * - 依存関連 
 */
export const useItemSpecialSales = ({ setState }: UseItemSpecialSalesArgs) => {
  // ダイアログ表示状態
  const [isShown, setIsShown] = useState(false);

  // ダイアログを開く
  const openSpecialSalesDialog = () => {
    setIsShown(true);
  };

  // ダイアログを閉じる
  const closeSpecialSalesDialog = () => {
    setIsShown(false);
  };

  // 特売設定の確定
  const onValueChange = (value: SpecialSale) => {
    setState((prev: any) => ({
      ...prev,
      ...value,
    }));
  };

  return {
    isShown,
    openSpecialSalesDialog,
    closeSpecialSalesDialog,
    onValueChange,
  };
};
