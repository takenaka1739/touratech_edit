import { ChangeEvent, useRef, useState } from 'react';
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
import { appAlert } from '@/components';
import { appConfirm } from '@/components';

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
  const importPricesInputRef = useRef<HTMLInputElement | null>(null);
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

  const getImportErrorMessage = (data: any): string => {
    if (data?.errMsg) {
      return String(data.errMsg);
    }

    const errors = data?.errors;
    if (errors && typeof errors === 'object') {
      return Object.values(errors).flat().join('\n');
    }

    return '取込に失敗しました。';
  };

  const onClickImportPrices = async (): Promise<void> => {
    if (isDisabled) {
      return;
    }

    importPricesInputRef.current?.click();
  };

  const onChangeImportPricesFile = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) {
      return;
    }

    const result = await appConfirm('Excelファイルから売上単価・仕入単価を取込みますか？');
    if (!result) {
      await appAlert('キャンセルしました');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setDisabled(true);
    dispatch(AppActions.request());

    try {
      const res = await axios.post(`/api/${slug}/import_prices`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.status === 200 && res.data.success) {
        dispatch(AppActions.success());
        const updatedCount = res.data.data?.updated_count ?? 0;
        await appAlert(`${updatedCount}件の単価を更新しました。`);
        onClickSearchButton();
      } else {
        dispatch(AppActions.failed('取込に失敗しました。'));
        await appAlert(getImportErrorMessage(res.data), 'error');
      }
    } catch (error) {
      dispatch(AppActions.failed('取込に失敗しました。'));
      await appAlert('取込に失敗しました。', 'error');
    } finally {
      setDisabled(false);
    }
  };

  const changeStockDisplay = async (value: number): Promise<void> => {
    const result = await appConfirm('在庫表示を一括変更しますか？');

    if (!result) {
      await appAlert('キャンセルしました');
    } else {
      const res = await axios.put('/api/item/display_status/update_all', value);
      if(res.status === 200) {
        dispatch(AppActions.success());
        if (res.data.success) {
          await appAlert('変更を保存しました');
        }
      }else{
        dispatch(AppActions.failed('変更に失敗しました'));
      }
    }
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
    onClickImportPrices,
    onChangeImportPricesFile,
    importPricesInputRef,
    changeStockDisplay,
    isDisabled,
  };
};
