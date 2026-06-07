// 更新: resources/ts/app/Purchase/components/PurchaseDetailDialog.tsx
// 変更点:
// - 数量だけ PurchaseInputNumber（マイナス許可）に差し替え（共通Inputは触らない）
// - 0が入力できない不具合を修正（value ? 判定を廃止）
// - min/max を -999..999 に設定

import React, { useEffect } from 'react';
import toNumber from 'lodash/toNumber';
import { Item, PurchaseDetail } from '@/types';
import { DialogWrapper, Forms } from '@/components';
import { useCommonSearchDialogProps } from '@/app/App/uses/useCommonSearchDialogProps';
import { useCommonDataDetailDialog } from '@/app/App/uses/useCommonDataDetailDialog';
import { ItemSearchDialog } from '@/app/Item/components/ItemSearchDialog';
import { numberFormat, calcAmount } from '@/utils';
import { PurchaseInputNumber } from './PurchaseInputNumber';

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
  const { open: openItemDialog, searchDialogProps: itemSearchDialogProps } =
    useCommonSearchDialogProps<Item>(
      'item',
      async props => {
        const { id, item_number, name, name_note, purchase_unit_price, is_set_item } = props;
        const unitPrice = purchase_unit_price ?? 0;
        const ret = calcAmount(unitPrice, 1, salesTaxRate, fraction);
        updateState({
          item_kind: is_set_item ? 2 : 1,
          item_id: id,
          item_number: item_number,
          item_name: name,
          item_name_jp: name_note,
          unit_price: unitPrice,
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

  const onChangeQuantity = (name: string, value: string | number | boolean | undefined) => {
    // 旧: value ? toNumber(value) : undefined だと 0 が undefined になる
    if (value === '' || value === undefined) {
      const ret = calcAmount(state.unit_price, undefined, salesTaxRate, fraction);
      updateState({ [name]: undefined, ...ret });
      return;
    }

    const quantity = toNumber(value);
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
          <Forms.FormGroup labelText="数量" required error={errors?.quantity} removeOptionalLabel>
            <div className="flex items-center">
              <PurchaseInputNumber
                name="quantity"
                value={state.quantity}
                error={errors?.quantity}
                precision={0}
                className="max-w-8"
                min={-999}
                max={999}
                onChange={(n, v) => onChangeQuantity(n, v)}
              />
            </div>
          </Forms.FormGroup>
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
