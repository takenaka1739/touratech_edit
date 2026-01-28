import { useState } from 'react';

type UseItemShopImageArgs = {
  state: any;
  setState: React.Dispatch<React.SetStateAction<any>>;
};

/**
 * 商品マスタの「ショップイメージ」用フックス。
 *
 * - ダイアログ表示状態
 * - ダイアログを開く
 * - ダイアログを閉じる
 * - ショップイメージの変更反映
 */
export const useItemShopImage = ({ state, setState }: UseItemShopImageArgs) => {
  // ダイアログ表示状態
  const [isShown, setIsShown] = useState(false);

  // ダイアログを開く
  const openShopImageDialog = () => {
    setIsShown(true);
  };

  // ダイアログを閉じる
  const closeShopImageDialog = () => {
    setState((prev: any) => ({
      ...prev,
      imageList: prev.isImageEdited ? prev.edtImageItems : prev.imageList,
    }));
    setIsShown(false);
  };

  /**
   * ショップイメージの変更を ItemDetailPage に反映する
   * （ShopImageDialog から渡される差分をそのまま state にマージ）
   */
  const onChangeShopImage = (updated: any) => {
    setState((prev: any) => ({
      ...prev,
      ...updated,
    }));
  };

  return {
    isShown,
    openShopImageDialog,
    closeShopImageDialog,
    onChangeShopImage,
  };
};
