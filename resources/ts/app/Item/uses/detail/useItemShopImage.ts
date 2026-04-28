import { useState } from 'react';

type UseItemShopImageArgs = {
  state: any;
  setState: React.Dispatch<React.SetStateAction<any>>;
};

// ShopImageDialog が扱う edtImageItems → preImageList への変換
const convertToPreImageList = (edtImageItems: any[][] = []) => {
  const result: any[] = [];

  edtImageItems.forEach(row => {
    const variId = row[0];
    const paths = row.slice(1);

    paths.forEach((path, index) => {
      if (typeof path === "string" && path.includes("youtube.com/embed")) {
        result.push([null, variId, path, index]);
        return;
      }

      if (path instanceof File) {
        result.push([null, variId, path, index]);
        return;
      }

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
 */
export const useItemShopImage = ({ setState }: UseItemShopImageArgs) => {
  const [isShown, setIsShown] = useState(false);

  const openShopImageDialog = () => {
    setIsShown(true);
  };

  const closeShopImageDialog = () => {
    setState((prev: any) => ({
      ...prev,
      imageList: prev.isImageEdited ? prev.edtImageItems ?? prev.imageList : prev.imageList,
    }));
    setIsShown(false);
  };

  const onChangeShopImage = (updated: any) => {
    setState((prev: any) => {
      const nextEdtImageItems = updated.edtImageItems ?? prev.edtImageItems;

      return {
        ...prev,
        ...updated,
        preImageList: Array.isArray(nextEdtImageItems)
          ? convertToPreImageList(nextEdtImageItems)
          : prev.preImageList,
      };
    });
  };

  return {
    isShown,
    openShopImageDialog,
    closeShopImageDialog,
    onChangeShopImage,
  };
};