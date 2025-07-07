import React, { useEffect } from 'react';
import toNumber from 'lodash/toNumber';
import { Item, CommonDataDetail } from '@/types';
import { DialogWrapper, Forms } from '@/components';
import { useCommonSearchDialogProps } from '../uses/useCommonSearchDialogProps';
import { useCommonDataDetailDialog } from '../uses/useCommonDataDetailDialog';
import { ItemSearchDialog } from '@/app/Item/components/ItemSearchDialog';
import { numberFormat, calcUnitPrice, calcAmount } from '@/utils';
import { getAnswerDate } from '@/utils/getAnswerDate';

export interface CommonDetailDialogProps<T> {
  title: string;
  slug: string;
  isShown: boolean;
  state: T;
  fraction: number;
  salesTaxRate: number;
  showAnswerDate?: boolean;
  receiveOrderDate?: string | undefined;
  updateState: <K extends keyof CommonDataDetail>(
    props: { [key in K]: CommonDataDetail[K] }
  ) => void;
  selectedFuncBefore?: (props: Item) => Promise<boolean>;
  onSelected: (detail: T) => void;
  onDeleted: (no: number) => void;
  onCancel: () => void;
}

type DataDetailDialog = <T extends CommonDataDetail>(
  props: CommonDetailDialogProps<T>
) => React.ReactElement<CommonDetailDialogProps<T>>;

/**
 * データ（明細）画面共通 Component
 *
 * @param props
 */
export const CommonDataDetailDialog: DataDetailDialog = ({
  title,
  slug,
  isShown,
  state,
  fraction,
  salesTaxRate,
  showAnswerDate,
  receiveOrderDate,
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
      const {
        id,
        item_number,
        name,
        name_jp,
        sales_unit_price,
        is_set_item,
        domestic_stock,
        overseas_stock,
      } = props;
      const unit_price = calcUnitPrice(sales_unit_price ?? 0, state.rate ?? 0, fraction);
      const ret = calcAmount(unit_price, 1, salesTaxRate, fraction);
      let answer_date: string | undefined = undefined;
      if (showAnswerDate) {
        answer_date = getAnswerDate(receiveOrderDate, domestic_stock, overseas_stock);
      }
      updateState({
        item_kind: is_set_item ? 2 : 1,
        item_id: id,
        item_number,
        item_name: name,
        item_name_jp: name_jp,
        sales_unit_price,
        unit_price,
        quantity: 1,
        sales_tax_rate: salesTaxRate,
        ...ret,
        answer_date,
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

  const onChange: (name: string, value: string | number | boolean | undefined) => void = (
    name,
    value
  ) => {
    if (name === 'answer_date' && (typeof value === 'string' || typeof value === 'undefined')) {
      updateState({ [name]: value });
      setErrors({ ...errors, [name]: '' });
    } else if (
      name === 'item_name' &&
      (typeof value === 'string' || typeof value === 'undefined')
    ) {
      updateState({ [name]: value });
    } else if (
      name === 'item_name_jp' &&
      (typeof value === 'string' || typeof value === 'undefined')
    ) {
      updateState({ [name]: value });
    }
  };

  const onChangeRate: (name: string, value: string | number | boolean | undefined) => void = (
    name,
    value
  ) => {
    const rate = value ? toNumber(value) : undefined;
    const unit_price = calcUnitPrice(state.sales_unit_price ?? 0, rate ?? 0, state.fraction);
    const ret = calcAmount(unit_price, state.quantity, salesTaxRate, state.fraction);
    updateState({ [name]: rate, unit_price, ...ret });
  };

  const onChangeUnitPrice: (name: string, value: string | number | boolean | undefined) => void = (
    name,
    value
  ) => {
    const unitPrice = value ? toNumber(value) : undefined;
    const ret = calcAmount(unitPrice, state.quantity, salesTaxRate, state.fraction);
    updateState({ [name]: unitPrice, ...ret });
    setErrors({ ...errors, [name]: '' });
  };

  const onChangeQuantity: (name: string, value: string | number | boolean | undefined) => void = (
    name,
    value
  ) => {
    const quantity = value ? toNumber(value) : undefined;
    const ret = calcAmount(state.unit_price, quantity, salesTaxRate, state.fraction);
    updateState({ [name]: quantity, ...ret });
  };

  const onClickSave = () => {
    save(state).then(ret => {
      if (ret) {
        onSelected(state);
      }
    });
  };

  const onClickDelete = () => {
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
                value={state.item_number ?? ''}
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
          <ItemSearchDialog {...itemSearchDialogProps} />
        </div>
        <Forms.FormGroupInputText
          labelText="商品名"
          name="item_name"
          value={state.item_name ?? ''}
          onChange={onChange}
          removeOptionalLabel
        />
        <Forms.FormGroupInputText
          labelText="商品名（納品書）"
          name="item_name_jp"
          value={state.item_name_jp ?? ''}
          onChange={onChange}
          removeOptionalLabel
        />
        <div className="w-1/2">
          <Forms.FormGroupInputText
            labelText="定価"
            name="sales_unit_price"
            value={numberFormat(state.sales_unit_price, 2)}
            className="max-w-8 text-right"
            readOnly
            removeOptionalLabel
          />
        </div>
        <div className="w-1/2">
          <Forms.FormGroupInputNumber
            labelText="掛率"
            labelUnitText="%"
            name="rate"
            value={state.rate ?? ''}
            error={errors?.rate}
            onChange={onChangeRate}
            precision={0}
            min={0}
            max={100}
          />
        </div>
        <div className="w-1/2">
          <Forms.FormGroupInputNumber
            labelText="単価"
            name="unit_price"
            value={state.unit_price}
            error={errors?.unit_price}
            onChange={onChangeUnitPrice}
            precision={2}
            required
            min={0}
            readOnly={state.item_kind !== 1}
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
            required
            min={0}
            max={999}
          />
        </div>
        <div className="flex max-w-2xl">
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
        {showAnswerDate && (
          <div className="max-w-xs">
            <Forms.FormGroupInputText
              labelText="回答納期"
              name="answer_date"
              value={state.answer_date ?? ''}
              error={errors?.answer_date}
              onChange={onChange}
            />
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-between">
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
