import { useCallback, useMemo, useState } from 'react';
import { appAlert } from '@/components';
import { ItemClassification } from '@/types';

type Props = {
  state: any;
  updateState: (props: any) => void;
};

type CategoryRow = {
  id?: number | null;
  categoryId?: number | null;
  categoryName?: string;
  category_name?: string;
  name?: string;
  status?: string;
};

type DialogOpenProps = {
  rowIndex?: number;
  excludeIds?: number[];
  currentCategoryId?: number | null;
};

export const useItemCategory = ({ state, updateState }: Props) => {
  const [isShown, setIsShown] = useState(false);
  const [rowIndex, setRowIndex] = useState<number | undefined>(undefined);
  const [excludeIds, setExcludeIds] = useState<number[]>([]);
  const [currentCategoryId, setCurrentCategoryId] = useState<number | null>(null);
  const [categoryChangeFlag, setCategoryChangeFlag] = useState(false);

  const normalizeCategoryList = (list: CategoryRow[]) => {
    const active = list.filter(x => x.status !== 'del');

    if (active.length > 0) {
      return list;
    }

    return [
      {
        id: null,
        categoryId: null,
        categoryName: '',
        category_name: '',
        name: '',
        status: 'new',
      },
    ];
  };

  const addNewCategory = useCallback(() => {
    const categoryList = [...(state.categoryList ?? [])];
    categoryList.push({
      id: null,
      categoryId: null,
      categoryName: '',
      category_name: '',
      name: '',
      status: 'new',
    });

    updateState({ categoryList });
    setCategoryChangeFlag(true);
  }, [state.categoryList, updateState]);

  const onDeleteCategory = useCallback(
    (index: number) => {
      const categoryList = [...(state.categoryList ?? [])];
      const row = categoryList[index];

      if (!row) {
        return;
      }

      if (row.status === 'new') {
        categoryList.splice(index, 1);
      } else {
        categoryList[index] = {
          ...row,
          status: 'del',
        };
      }

      updateState({
        categoryList: normalizeCategoryList(categoryList),
      });
      setCategoryChangeFlag(true);
    },
    [state.categoryList, updateState]
  );

  const openDialog = useCallback((props?: DialogOpenProps) => {
    setRowIndex(props?.rowIndex);
    setExcludeIds(props?.excludeIds ?? []);
    setCurrentCategoryId(props?.currentCategoryId ?? null);
    setIsShown(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsShown(false);
    setRowIndex(undefined);
    setExcludeIds([]);
    setCurrentCategoryId(null);
  }, []);

  const onSelected = useCallback(
    async (item: ItemClassification) => {
      const targetIndex = rowIndex ?? 0;
      const categoryList = [...(state.categoryList ?? [])];

      if (!categoryList[targetIndex]) {
        categoryList[targetIndex] = {
          id: null,
          categoryId: null,
          categoryName: '',
          category_name: '',
          name: '',
          status: 'new',
        };
      }

      categoryList[targetIndex] = {
        ...categoryList[targetIndex],
        categoryId: item.id,
        categoryName: item.name,
        category_name: item.name,
        name: item.name,
        status: categoryList[targetIndex].id ? 'edit' : 'new',
      };

      updateState({ categoryList });
      setCategoryChangeFlag(true);
      closeDialog();
    },
    [rowIndex, state.categoryList, updateState, closeDialog]
  );

  const onSelectedMultiple = useCallback(
    async (items: ItemClassification[]) => {
      if (!items || items.length === 0) {
        await appAlert('商品分類が選択されていません。');
        return;
      }

      const targetIndex = rowIndex ?? 0;
      const currentList: CategoryRow[] = [...(state.categoryList ?? [])];

      while (currentList.length <= targetIndex) {
        currentList.push({
          id: null,
          categoryId: null,
          categoryName: '',
          category_name: '',
          name: '',
          status: 'new',
        });
      }

      const activeSelectedIds = new Set(
        currentList
          .filter((x, idx) => x.status !== 'del' && idx !== targetIndex)
          .map(x => x.categoryId)
          .filter((id): id is number => id != null)
      );

      const filteredItems = items.filter(x => x.id != null && !activeSelectedIds.has(x.id));

      if (filteredItems.length === 0) {
        await appAlert('選択した商品分類はすでに登録されています。');
        return;
      }

      const newList = [...currentList];

      filteredItems.forEach((item, idx) => {
        if (idx === 0) {
          const currentRow = newList[targetIndex] ?? {
            id: null,
            categoryId: null,
            categoryName: '',
            category_name: '',
            name: '',
            status: 'new',
          };

          newList[targetIndex] = {
            ...currentRow,
            categoryId: item.id,
            categoryName: item.name,
            category_name: item.name,
            name: item.name,
            status: currentRow.id ? 'edit' : 'new',
          };
          return;
        }

        newList.push({
          id: null,
          categoryId: item.id,
          categoryName: item.name,
          category_name: item.name,
          name: item.name,
          status: 'new',
        });
      });

      updateState({ categoryList: newList });
      setCategoryChangeFlag(true);
      closeDialog();
    },
    [rowIndex, state.categoryList, updateState, closeDialog]
  );

  const itemClassSearchDialogProps = useMemo(
    () => ({
      isShown,
      onSelected,
      onSelectedMultiple,
      onCancel: closeDialog,
      openDialog,
      excludeIds,
      rowIndex,
      currentCategoryId,
    }),
    [
      isShown,
      onSelected,
      onSelectedMultiple,
      closeDialog,
      openDialog,
      excludeIds,
      rowIndex,
      currentCategoryId,
    ]
  );

  return {
    addNewCategory,
    onDeleteCategory,
    itemClassSearchDialogProps,
    categoryChangeFlag,
    setCategoryChangeFlag,
  };
};