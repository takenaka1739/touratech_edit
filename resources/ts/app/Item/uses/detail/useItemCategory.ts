import { useState, useEffect } from 'react';
import { Category } from '@/app/Item/modules/types/Category';
import { useCommonSearchDialogProps } from '@/app/App/uses/useCommonSearchDialogProps';
import { ItemClassification } from '@/types';

type UseItemCategoryArgs = {
  state: any;
  setState: React.Dispatch<React.SetStateAction<any>>;
};

/**
 * 商品マスタの「商品分類」用フックス。
 * 
 * - 商品分類行の追加
 * - 商品分類の変更
 * - 商品分類関連のuseEffect
 * - categoryChangeFlag / supplierChangeFlag の管理
 * - itemClassSearchDialogProps の連携
 */
export const useItemCategory = ({
  state,
  setState,
}: UseItemCategoryArgs) => {
  const [changeCategoryIndex, setChangeCategoryIndex] = useState<number | null>(null);
  const [categoryChangeFlag, setCategoryChangeFlag] = useState(false);
  const [supplierChangeFlag, setSupplierChangeFlag] = useState(false); // ★追加

  // ==============================================================
  // カテゴリ検索ダイアログ
  // ==============================================================
  const {
    open: openItemClassDialog,
    searchDialogProps: itemClassSearchDialogProps,
  } = useCommonSearchDialogProps<ItemClassification>(
    'item_classification',
    async ({ id, name }) => {
      // 重複チェック
      const isDuplicate = state.categoryList.some(
        (item: any) =>
          item.status !== 'del' &&
          item.categoryId === id &&
          item.originalIndex !== changeCategoryIndex
      );

      // 重複が無ければ更新
      if (!isDuplicate) {
        changeCategory({ id: id ?? 0, name: name ?? '' });
      }

      return true;
    }
  );

  // ==============================================================
  // カテゴリ行追加
  // ==============================================================
  const addNewCategory = () => {
    setState((prev: any) => {
      const currentList = Array.isArray(prev.categoryList) ? prev.categoryList : [];

      const newStatuses = currentList
        .map((item: any) => item.status)
        .filter((status: any) => /^new\d+$/.test(status));

      const maxNumber =
        newStatuses.length > 0
          ? Math.max(...newStatuses.map((s: any) => parseInt(s.replace('new', ''), 10)))
          : 0;

      const nextStatus = `new${maxNumber + 1}`;

      const arr: Category = {
        combId: undefined,
        categoryId: null,
        name: '',
        status: nextStatus,
        initialcategoryId: undefined,
      };

      return { ...prev, categoryList: [...currentList, arr] };
    });
  };

  // ==============================================================
  // カテゴリ変更
  // ==============================================================
  const changeCategory = ({ id, name }: { id: number; name: string }) => {
    if (changeCategoryIndex === null) return;

    setState((prev: any) => {
      const list = [...prev.categoryList];
      const target = list[changeCategoryIndex];

      // 削除済みの同じカテゴリがあれば復活
      const deletedIndex = list.findIndex(
        item => item.status === 'del' && item.categoryId === id
      );

      if (deletedIndex !== -1) {
        const deletedItem = list[deletedIndex];

        list[changeCategoryIndex] = {
          ...target,
          combId: deletedItem.combId,
          categoryId: deletedItem.categoryId,
          name: deletedItem.name,
          initialcategoryId: deletedItem.initialcategoryId,
          status:
            deletedItem.categoryId === deletedItem.initialcategoryId
              ? 'no update'
              : 'update',
        };

        list.splice(deletedIndex, 1);
        return { ...prev, categoryList: list };
      }

      // 通常の更新
      list[changeCategoryIndex] = {
        ...target,
        categoryId: id,
        name,
        status: target.combId
          ? id === target.initialcategoryId
            ? 'no update'
            : 'update'
          : 'new',
      };

      return { ...prev, categoryList: list };
    });
  };

  // ==============================================================
  // カテゴリ変更ボタン
  // ==============================================================
  const onChangeCategory = (originalIndex: number) => {
    setChangeCategoryIndex(originalIndex);
    openItemClassDialog();
  };

  // ==============================================================
  // カテゴリ削除
  // ==============================================================
  const onDeleteCategory = (originalIndex: number) => {
    setCategoryChangeFlag(true);

    setState((prev: any) => {
      const target = prev.categoryList[originalIndex];

      // new の場合は削除
      if (target.status.includes('new')) {
        return {
          ...prev,
          categoryList: prev.categoryList.filter((_: any, index: number) => index !== originalIndex),
        };
      }

      // update / no update の場合は del に変更
      return {
        ...prev,
        categoryList: prev.categoryList.map((item: any, index: number) =>
          index === originalIndex ? { ...item, status: 'del' } : item
        ),
      };
    });

    setChangeCategoryIndex(originalIndex);
  };

  // ==============================================================
  // カテゴリ復元処理（useEffect）
  // ==============================================================
  useEffect(() => {
    if (changeCategoryIndex !== null) {
      if (state.category_id !== undefined && state.category_name !== undefined) {
        const flag = state.categoryList.some(
          (item: any) =>
            item.categoryId !== null &&
            item.status !== 'del' &&
            item.categoryId === state.category_id
        );

        if (!flag) {
          setState((prev: any) => {
            const delIndex = prev.categoryList.findIndex(
              (item: any) => item.status === 'del' && item.categoryId === state.category_id
            );

            if (delIndex !== -1) {
              const delItem = prev.categoryList[delIndex];

              const revivedList = prev.categoryList.map((item: any, idx: number) => {
                if (idx === changeCategoryIndex) {
                  return {
                    ...item,
                    combId: delItem.combId,
                    categoryId: delItem.categoryId,
                    name: delItem.name,
                    initialcategoryId: delItem.initialcategoryId,
                    status:
                      delItem.categoryId === delItem.initialcategoryId
                        ? 'no update'
                        : 'update',
                  };
                }
                return item;
              });

              const maxNewIndex = revivedList.reduce(
                (acc: any, item: any, idx: number) => {
                  if (item.categoryId == null && /^new\d+$/.test(item.status)) {
                    const num = parseInt(item.status.replace('new', ''), 10);
                    if (num > acc.value) {
                      return { value: num, index: idx };
                    }
                  }
                  return acc;
                },
                { value: -1, index: -1 }
              );

              let filteredList = revivedList;
              if (maxNewIndex.index !== -1 && delIndex === changeCategoryIndex) {
                filteredList = revivedList.filter((_: any, idx: number) => idx !== maxNewIndex.index);
              }

              return { ...prev, categoryList: filteredList };
            }

            return {
              ...prev,
              categoryList: prev.categoryList.map((item: any, index: number) => {
                if (index !== changeCategoryIndex) return item;

                if (item.status.includes('new')) {
                  return {
                    ...item,
                    categoryId: state.category_id,
                    name: state.category_name,
                    status: item.status,
                  };
                } else if (state.category_id === item.initialcategoryId) {
                  return {
                    ...item,
                    categoryId: state.category_id,
                    name: state.category_name,
                    status: 'no update',
                  };
                } else {
                  return {
                    ...item,
                    categoryId: state.category_id,
                    name: state.category_name,
                    status: 'update',
                  };
                }
              }),
            };
          });
        }
      }
    }
  }, [state.category_id, state.category_name]);

  return {
    changeCategoryIndex,
    categoryChangeFlag,
    setCategoryChangeFlag,
    supplierChangeFlag,
    setSupplierChangeFlag,
    addNewCategory,
    onChangeCategory,
    onDeleteCategory,
    changeCategory,
    itemClassSearchDialogProps,
  };
};
