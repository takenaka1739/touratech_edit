import { useState } from 'react';
import { useCommonSearchDialogProps } from '@/app/App/uses/useCommonSearchDialogProps';
import { Supplier } from '@/types';

type UseItemSupplierArgs = {
  state: any;
  setState: React.Dispatch<React.SetStateAction<any>>;
};

/**
 * 商品マスタの「仕入先」用フックス。
 *
 * - 仕入先検索ダイアログの管理
 * - 仕入先選択時の state 更新
 * - supplierChangeFlag の管理
 */
export const useItemSupplier = ({ setState }: UseItemSupplierArgs) => {
  const [supplierChangeFlag, setSupplierChangeFlag] = useState(false);

  // ==============================================================
  // 仕入先検索ダイアログ
  // ==============================================================
  const {
    open: openSupplierDialog,
    searchDialogProps: supplierSearchDialogProps,
  } = useCommonSearchDialogProps<Supplier>(
    'supplier',
    async ({ id, name }) => {
      // 仕入先選択時の更新
      setSupplierChangeFlag(true);

      setState((prev: any) => ({
        ...prev,
        supplier_id: id ?? null,
        supplier_name: name ?? '',
      }));

      return true;
    }
  );

  return {
    supplierChangeFlag,
    setSupplierChangeFlag,
    openSupplierDialog,
    supplierSearchDialogProps,
  };
};
