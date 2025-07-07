import React, { useEffect } from 'react';
import toNumber from 'lodash/toNumber';
import { Item, PurchaseDetail } from '@/types';
import { DialogWrapper, Forms } from '@/components';
import { useCommonSearchDialogProps } from '@/app/App/uses/useCommonSearchDialogProps';
import { useCommonDataDetailDialog } from '@/app/App/uses/useCommonDataDetailDialog';
import { ItemSearchDialog } from '@/app/Item/components/ItemSearchDialog';
import { numberFormat, calcAmount } from '@/utils';

export type PurchaseDetailDialogProps = {
  title: string;
  slug: string;
  isShown: boolean;
  state: PurchaseDetail;
  salesTaxRate: number;
  fraction: number;
  updateState: (props: { [key: string]: string | number | undefined }) => void;
  selectedFuncBefore?: (props: Item) => Promise<boolean>;
  onSelected: (detail: PurchaseDetail) => void;
  onDeleted: (id: number) => void;
  onCancel: () => void;
};

/**
 * 仕入データ（明細）画面 Component
 *
 * @param props
 */
export const PurchaseDetailDialog: React.VFC<PurchaseDetailDialogProps> = ({
  title,
  slug,
  isShown,
  state,
  salesTaxRate,
  fraction,
  updateState,
  selectedFuncBefore,
  onSelected,
  onDeleted,
  onCancel,
}) => {
  const { errors, setErrors, save } = useCommonDataDetailDialog(slug);
  const {
    open: openItemDialog,
    searchDialogProps: itemSearchDialogProps,
  } = useCommonSearchDialogProps<Item>(
    'item',
    async props => {
      const { id, item_number, name, name_jp, sales_unit_price, is_set_item } = props;
      const ret = calcAmount(sales_unit_price, 1, salesTaxRate, fraction);
      updateState({
        item_kind: is_set_item ? 2 : 1,
        item_id: id,
        item_number,
        item_name: name,
        item_name_jp: name_jp,
        unit_price: sales_unit_price,
        quantity: 1,
        sales_tax_rate: salesTaxRate,
        ...ret,
      });
      setErrors(undefined);
      return true;
    },
    selectedFuncBefore
  );

  useEffect(() => {
    if (isShown) {
      setErrors(undefined);
    }
  }, [isShown]);

  const onChangeQuantity: (name: string, value: string | number | boolean | undefined) => void = (
    name,
    value
  ) => {
    const quantity = value ? toNumber(value) : undefined;
    const ret = calcAmount(state.unit_price, quantity, salesTaxRate, fraction);
    updateState({ [name]: quantity, ...ret });
  };

  const onClickSave: () => void = () => {
    save(state).then(ret => {
      if (ret) {
        onSelected(state);
      }
    });
  };

  const onClickDelete: () => void = () => {
    if (state.no) {
      onDeleted(state.no);
    }
  };

  return (
    <DialogWrapper title={`${title}明細`} isShown={isShown} onClickCancel={onCancel}>
      <div className="form-group-wrapper">
        <div>
          <Forms.FormGroup labelText="品番" required error={errors?.item_id} groupClassName="mt-0">
            <div className="flex">
              <Forms.FormInputText
                name="item_number"
                value={state.item_number}
                error={errors?.item_id}
                className="max-w-lg"
                readOnly
              />
              <input type="hidden" name="item_id" value={state.item_id ?? ''} />
              <button className="btn ml-2 py-0 px-2" onClick={openItemDialog}>
                ...
              </button>
            </div>
          </Forms.FormGroup>
          <ItemSearchDialog {...itemSearchDialogProps} isSetItem={false} />
        </div>
        <Forms.FormGroupInputText
          labelText="商品名"
          name="item_name"
          value={state.item_name}
          className="max-w-lg"
          readOnly
          removeOptionalLabel
        />
        <div className="w-1/2">
          <Forms.FormGroupInputText
            labelText="単価"
            name="unit_price"
            value={numberFormat(state.unit_price, 2)}
            className="max-w-8 text-right"
            readOnly
            removeOptionalLabel
          />
        </div>
        <div className="w-1/2">
          <Forms.FormGroupInputNumber
            labelText="数量"
            name="quantity"
            value={state.quantity}
            error={errors?.quantity}
            onChange={onChangeQuantity}
            precision={0}
            className="max-w-8"
            required
          />
        </div>
        <div className="w-1/2">
          <Forms.FormGroupInputText
            labelText="金額"
            name="amount"
            value={numberFormat(state.amount, 0)}
            className="max-w-8 text-right"
            readOnly
            removeOptionalLabel
          />
        </div>
        <div className="w-1/2">
          <Forms.FormGroupInputText
            labelText="消費税"
            name="sales_tax"
            value={numberFormat(state.sales_tax, 0)}
            className="max-w-8 text-right"
            readOnly
            removeOptionalLabel
          />
        </div>
      </div>

      <div className="mt-4 form-group flex justify-between">
        <button className="btn" onClick={onClickSave}>
          保存
        </button>
        {state?.no != undefined && (
          <button className="btn-delete" onClick={onClickDelete}>
            削除
          </button>
        )}
      </div>
    </DialogWrapper>
  );
};
