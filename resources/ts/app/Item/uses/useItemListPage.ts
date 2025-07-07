import { useState } from 'react';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { RootState } from '@/store';
import { Item, Supplier, Pager } from '@/types';
import {
  ItemListPageConditionState,
  ItemListPageActions,
  itemInitialState,
} from '../modules/itemListPageModule';
import { useCommonListPage } from '@/app/App/uses/useCommonListPage';
import { useCommonSearchDialogProps } from '@/app/App/uses/useCommonSearchDialogProps';
import { AppActions } from '@/app/App/modules/appModule';

export type ItemPageState = {
  rows: Item[];
  pager: Pager | undefined;
};

/**
 * 商品マスタ（一覧）画面用 hooks
 */
export const useItemListPage = (slug: string) => {
  const dispatch = useDispatch();
  const [isDisabled, setDisabled] = useState(false);
  const initialConditions = itemInitialState.conditions;

  const setConditions = useCallback(
    (conditions: ItemListPageConditionState) =>
      dispatch(ItemListPageActions.setConditions(conditions)),
    [dispatch]
  );

  const getConditions = () => {
    return useSelector((state: RootState) => state.itemListPage.conditions);
  };

  const {
    isLoading,
    state,
    conditions,
    updateConditions,
    onChange,
    onClickSearchButton,
    onClickClearButton,
    onChangePage,
    addDetail,
  } = useCommonListPage<ItemPageState, ItemListPageConditionState>(
    slug,
    {
      rows: [],
      pager: undefined,
    },
    initialConditions,
    getConditions,
    setConditions
  );
  const {
    open: openSupplierDialog,
    searchDialogProps: supplierSearchDialogProps,
  } = useCommonSearchDialogProps<Supplier>('supplier', async props => {
    const { id, name } = props;
    updateConditions({
      c_supplier_id: id,
      c_supplier_name: name,
    });
    return true;
  });

  const output: () => Promise<boolean> = async () => {
    dispatch(AppActions.request());

    const res = await axios.post(`/api/${slug}/output_excel`, conditions);
    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        const { file_id } = res.data.data;
        const link = document.createElement('a');
        link.href = `/web/${slug}/output_excel/${file_id}`;
        link.click();

        return true;
      }
    } else {
      dispatch(AppActions.failed('出力に失敗しました。'));
    }
    return false;
  };

  const onClickOutput: () => void = async () => {
    setDisabled(true);
    await output();
    setDisabled(false);
  };

  const changeStockDisplay: () => void = async () => {

  };

  return {
    isLoading,
    state,
    conditions,
    openSupplierDialog,
    supplierSearchDialogProps,
    onChange,
    onClickSearchButton,
    onClickClearButton,
    onChangePage,
    addDetail,
    onClickOutput,
    changeStockDisplay,
    isDisabled,
  };
};
