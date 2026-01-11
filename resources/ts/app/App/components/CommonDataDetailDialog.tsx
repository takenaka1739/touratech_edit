// 更新: resources/ts/app/App/components/CommonDataDetailDialog.tsx
import React, { useEffect } from 'react';
import toNumber from 'lodash/toNumber';
import { Item, CommonDataDetail } from '@/types';
import { DialogWrapper, Forms } from '@/components';
import { useCommonSearchDialogProps } from '../uses/useCommonSearchDialogProps';
import { useCommonDataDetailDialog } from '../uses/useCommonDataDetailDialog';
import { ItemSearchDialog } from '@/app/Item/components/ItemSearchDialog';
import { getAnswerDate } from '@/utils/getAnswerDate';
import { numberFormat, calcUnitPrice } from '@/utils';
import { calcAmountExternalTax } from '@/utils/calcAmountExternalTax';

export interface CommonDetailDialogProps<T> {
  title: string;
  slug: string;
  isShown: boolean;
  state: T;
  fraction: number;
  salesTaxRate: number;
  showAnswerDate?: boolean;
  receiveOrderDate?: string | undefined;
  updateState: <K extends keyof CommonDataDetail>(props: { [key in K]: CommonDataDetail[K] }) => void;
  selectedFuncBefore?: (props: Item) => Promise<boolean>;
  onSelected: (detail: T) => void;
  onDeleted: (no: number) => void;
  onCancel: () => void;
}

type DataDetailDialog = <T extends CommonDataDetail>(
  props: CommonDetailDialogProps<T>
) => React.ReactElement<CommonDetailDialogProps<T>>;

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

  /**
   * 🔽 外税再計算を1か所に集約
   */
  const recalc = (
    unitPrice: number | undefined,
    quantity: number | undefined,
    discount: number | undefined
  ) => {
    return calcAmountExternalTax(unitPrice, quantity, discount, salesTaxRate, fraction);
  };

  const { open: openItemDialog, searchDialogProps: itemSearchDialogProps } =
    useCommonSearchDialogProps<Item>(
      'item',
      async props => {
        const p: any = props as any;
        const itemNumber: string =
          (p.item_number ?? p.itemNo ?? p.item_no ?? p.code ?? '') as string;
        const domesticStocks: number =
          toNumber(p.domestic_stocks ?? p.domestic_stock ?? p.domesticStock ?? 0);
        const overseasStocks: number =
          toNumber(p.overseas_stocks ?? p.overseas_stock ?? p.overseasStock ?? 0);

        const {
          id,
          name,
          name_note,
          sales_unit_price,
          is_set_item,
        } = p;

        const unit_price = calcUnitPrice(sales_unit_price ?? 0, state.rate ?? 0, fraction);
        const ret = recalc(unit_price, 1, state.discount ?? 0);

        let answer_date: string | undefined = undefined;
        if (showAnswerDate) {
          answer_date = getAnswerDate(receiveOrderDate, domesticStocks, overseasStocks);
        }

        updateState({
          item_kind: is_set_item ? 2 : 1,
          item_id: id,

          // ★これが無いと品番欄に絶対入らない
          item_number: itemNumber,

          item_name: name,
          item_name_jp: name_note,
          sales_unit_price,
          unit_price,
          quantity: 1,
          discount: state.discount ?? 0,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShown]);

  const onChange = (name: string, value: string | number | boolean | undefined) => {
    if (name === 'answer_date' && (typeof value === 'string' || typeof value === 'undefined')) {
      updateState({ [name]: value } as any);
      setErrors({ ...errors, [name]: '' });
      return;
    }
    if (
      (name === 'item_name' || name === 'item_name_jp') &&
      (typeof value === 'string' || typeof value === 'undefined')
    ) {
      updateState({ [name]: value } as any);
    }
  };

  const onChangeRate = (name: string, value: string | number | boolean | undefined) => {
    const rate = value ? toNumber(value) : undefined;
    const unit_price = calcUnitPrice(state.sales_unit_price ?? 0, rate ?? 0, fraction);
    const ret = recalc(unit_price, state.quantity, state.discount);
    updateState({ [name]: rate, unit_price, ...ret } as any);
  };

  const onChangeUnitPrice = (name: string, value: string | number | boolean | undefined) => {
    const unitPrice = value ? toNumber(value) : undefined;
    const ret = recalc(unitPrice, state.quantity, state.discount);
    updateState({ [name]: unitPrice, ...ret } as any);
    setErrors({ ...errors, [name]: '' });
  };

  const onChangeQuantity = (name: string, value: string | number | boolean | undefined) => {
    const quantity = value ? toNumber(value) : undefined;
    const ret = recalc(state.unit_price, quantity, state.discount);
    updateState({ [name]: quantity, ...ret } as any);
  };

  const onChangeDetailDiscount = (name: string, value: string | number | boolean | undefined) => {
    const discount = value === '' || value === undefined ? 0 : toNumber(value);
    const ret = recalc(state.unit_price, state.quantity, discount);

    updateState({ [name]: discount, ...ret } as any);
    setErrors({ ...errors, [name]: '' });
  };

  const onClickSave = () => {
    const snapshot = { ...(state as any) };
    save(snapshot).then(ret => {
      if (ret) {
        onSelected(snapshot);
      }
    });
  };

  const onClickDelete = () => {
    if (state.no) onDeleted(state.no);
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

        <div className="w-1/2">
          <Forms.FormGroupInputNumber
            labelText="割引"
            name="discount"
            value={state.discount ?? 0}
            error={(errors as any)?.discount}
            onChange={onChangeDetailDiscount}
            precision={2}
            min={0}
          />
        </div>

        <div className="flex max-w-2xl">
          <div className="w-1/2">
            <Forms.FormGroupInputText
              labelText="金額（税込）"
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
