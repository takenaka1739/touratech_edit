import { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

type UseItemNavigationArgs = {
  state: any;
  setState: React.Dispatch<React.SetStateAction<any>>;
  updateState: (value: any) => void;

  variItems: string[][];
  variChangeItem: string[][];
  setVariChangeItem: (value: any) => void;

  categoryChangeFlag: boolean;
  supplierChangeFlag: boolean;
  setCategoryChangeFlag: (value: boolean) => void;
  setSupplierChangeFlag: (value: boolean) => void;

  setvariClickFlag: (value: boolean) => void;

  setTypeName: (value: string) => void;
  setLinkName: (value: string) => void;
};

/**
 * 商品マスタの「ページ遷移・location.state の復元」用フックス。
 * 
 * - ページ遷移
 * - location.state の復元
 * - filledItems の生成
 * - 依存関連 
 */
export const useItemNavigation = ({
  state,
  setState,
  updateState,

  variItems,
  variChangeItem,
  setVariChangeItem,

  categoryChangeFlag,
  supplierChangeFlag,
  setCategoryChangeFlag,
  setSupplierChangeFlag,

  setvariClickFlag,

  setTypeName,
  setLinkName,
}: UseItemNavigationArgs) => {
  const history = useHistory();
  const location = useLocation<any>();

  // ==============================================================
  // filledItems（null を上の行から補完）
  // ==============================================================
  const filledItems = variItems.map((row, rowIndex) => {
    return row.map((cell, colIndex) => {
      if (cell !== null) return cell;

      for (let i = rowIndex - 1; i >= 0; i--) {
        const prev = variItems[i][colIndex];
        if (prev !== null) return prev;
      }

      return null;
    });
  });

  // ==============================================================
  // ページ遷移（ショップイメージへ）
  // ==============================================================
  const useMovePage = () => {
    history.push({
      pathname: '/item/shop-image',
      state: {
        item_id: state.id,
        preVariItem: variItems,
        exDetail: state.explanation_details,
        variItems: filledItems,
        variChangeItem: variChangeItem,
        backVariItems: state.backVariItems,
        imageItems: state.imageList,
        categoryChangeFlag: categoryChangeFlag,
        supplierChangeFlag: supplierChangeFlag,
        items: state,
      },
    });
  };

  // ==============================================================
  // 戻る
  // ==============================================================
  const backPage = () => history.push(`/item`);

  // ==============================================================
  // ショップイメージから戻ってきたときの復元処理
  // ==============================================================
  useEffect(() => {
    if (location.state !== undefined) {
      setvariClickFlag(false);

      // 画像リスト
      if (Array.isArray(location.state.imageItem)) {
        setCategoryChangeFlag(location.state.categoryChangeFlag);
        setSupplierChangeFlag(location.state.supplierChangeFlag);

        setState((prev: any) => ({
          ...prev,
          imageList: location.state.imageItem,
        }));
      }

      // バリエーション復元
      if (location.state.variChangeItem) {
        setVariChangeItem(location.state.variChangeItem);
      }

      // type_name の復元
      if (location.state.preState?.type_status === 3) {
        setTypeName(location.state.preState.type_name);
      }

      // type_link_name の復元
      if (location.state.preState?.type_link_status === 3) {
        setLinkName(location.state.preState.type_link_name);
      }

      // state の復元
      if (location.state.preState) {
        setState((prev: any) => ({
          ...prev,
          category_name: location.state.preState.category_name,
          category_id: location.state.preState.category_id,
          name: location.state.itemName,
          explanation_details: location.state.exDetail,
          variItems: location.state.preVariItem,
          supplier_name: location.state.preState.supplier_name,
          supplier_id: location.state.preState.supplier_id,
          type_status: location.state.preState.type_status,
          type_status_link: location.state.preState.type_status_link,
          type_name: location.state.preState.type_name,
          file_name: location.state.preState.file_name,
          categoryList: location.state.preState.categoryList,
          pdf: location.state.preState.pdf,
        }));
      }
    }
  }, [location.state]);

  // ==============================================================
  // preState の復元（2 回目の useEffect）
  // ==============================================================
  useEffect(() => {
    if (location.state !== undefined && Array.isArray(location.state.imageItem)) {
      updateState(location.state.preState);
    }
  }, []);

  return {
    useMovePage,
    backPage,
  };
};
