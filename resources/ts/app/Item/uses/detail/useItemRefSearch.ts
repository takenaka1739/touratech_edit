import { useCommonSearchDialogProps } from '@/app/App/uses/useCommonSearchDialogProps';
import { Item } from '@/types';

type UseItemRefSearchArgs = {
  setState: React.Dispatch<React.SetStateAction<any>>;
};

const cloneCategoryList = (categoryList: any[] = []) =>
  categoryList.map(category => ({
    ...category,
    id: undefined,
    combId: null,
    status: 'new',
    initialcategoryId: undefined,
  }));

const cloneVariItems = (variItems: any[][] = []) =>
  variItems.map((row, index) => {
    const nextKey = `new${index + 1}`;
    return [nextKey, ...row.slice(1)];
  });

const cloneImageList = (imageList: any[][] = [], variItems: any[][] = []) =>
  imageList.map((row, index) => {
    const nextKey = variItems[index]?.[0] ?? `new${index + 1}`;
    return [nextKey, ...row.slice(1)];
  });

const cloneSpecialSalesList = (specialSalesList: any[] = []) =>
  specialSalesList.map(row => ({
    ...row,
    special_sale_id: undefined,
    special_sale_item_id: undefined,
  }));

const buildReferencedItemState = (prev: any, item: any) => {
  const variItems = cloneVariItems(Array.isArray(item.variItems) ? item.variItems : []);
  const imageList = cloneImageList(Array.isArray(item.imageList) ? item.imageList : [], variItems);

  return {
    ...item,
    id: prev.id,
    item_id: prev.item_id,
    ref_item_id: item.id,
    variItems,
    backVariItems: variItems,
    imageList,
    categoryList: cloneCategoryList(item.categoryList),
    categoryListAll: [],
    combIdList: [],
    preImageList: [],
    codeList: [],
    special_sale_id: undefined,
    special_sale_item_id: undefined,
    specialSalesList: cloneSpecialSalesList(item.specialSalesList),
    document_id: undefined,
    documentFileList: [],
    pdf: undefined,
    initialCode: prev.initialCode ?? '',
  };
};

export const useItemRefSearch = ({ setState }: UseItemRefSearchArgs) => {
  const {
    open: openItemRefDialog,
    searchDialogProps: itemRefSearchDialogProps,
  } = useCommonSearchDialogProps<Item>(
    'item',
    async ({ id }) => {
      // 他商品情報参照で選択された商品の ID を state に反映
      setState((prev: any) => ({
        ...prev,
        ref_item_id: id,
      }));
      return true;
    }
  );

  const onChangeRefState = (value: any) => {
    setState((prev: any) => ({
      ...prev,
      ...buildReferencedItemState(prev, value),
    }));
  };

  return {
    openItemRefDialog,
    itemRefSearchDialogProps,
    onChangeRefState,
  };
};
