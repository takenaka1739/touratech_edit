import React from 'react';
import { Forms } from '@/components';
import { SupplierSearchDialog } from '@/app/Supplier/components/SupplierSearchDialog';

type Props = {
  state: any;
  errors: any;
  onChange: (name: string, value: string | number | boolean | undefined) => void;
  openSupplierDialog: () => void;
  supplierSearchDialogProps: any;
};

/**
 * 商品マスタの「仕入先」入力セクション。
 *
 * - 仕入先名（supplier_name：表示用）
 * - 仕入先ID（supplier_id：hidden）
 * - 仕入先検索ダイアログの起動
 */
export const ItemSupplierSection: React.VFC<Props> = ({
  state,
  errors,
  openSupplierDialog,
  supplierSearchDialogProps,
}) => {
  return (
    <div>
      <Forms.FormGroup labelText="仕入先" required error={errors?.supplier_name}>
        <div className="flex">
          <Forms.FormInputText
            name="supplier_name"
            value={state.supplier_name}
            error={errors?.supplier_name}
            className="max-w-lg"
            readOnly
          />

          <input
            type="hidden"
            name="supplier_id"
            value={state.supplier_id ?? ''}
          />

          <button
            className="btn ml-2 py-0 px-2"
            onClick={openSupplierDialog}
          >
            ...
          </button>
        </div>
      </Forms.FormGroup>

      <SupplierSearchDialog {...supplierSearchDialogProps} />
    </div>
  );
};
