import { useState } from 'react';

type UseItemShopImageArgs = {
  state: any;
  setState: React.Dispatch<React.SetStateAction<any>>;
};

// ShopImageDialog が扱う edtImageItems → preImageList への変換
const convertToPreImageList = (edtImageItems: any[][]) => {
  const result: any[] = [];

  edtImageItems.forEach(row => {
    const variId = row[0];
    const paths = row.slice(1);

    paths.forEach((path, index) => {
      // YouTube はそのまま
      if (typeof path === "string" && path.includes("youtube.com/embed")) {
        result.push([null, variId, path, index]);
        return;
      }

      // File はそのまま preImageList に入れる
      if (path instanceof File) {
        result.push([null, variId, path, index]);
        return;
      }

      // /images/xxx.png → xxx.png
      let fileName = path;
      if (typeof path === "string" && path.startsWith("/images/")) {
        fileName = path.replace("/images/", "");
      }

      result.push([null, variId, fileName, index]);
    });
  });

  return result;
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
      preImageList: convertToPreImageList(updated.edtImageItems),
    }));
  };

  return {
    isShown,
    openShopImageDialog,
    closeShopImageDialog,
    onChangeShopImage,
  };
};
