// resources/ts/app/App/components/CommonDataDetailDialog.tsx
import React, { useEffect } from 'react';
import toNumber from 'lodash/toNumber';
import { Item, CommonDataDetail } from '@/types';
import { DialogWrapper, Forms } from '@/components';
import { useCommonSearchDialogProps } from '../uses/useCommonSearchDialogProps';
import { useCommonDataDetailDialog } from '../uses/useCommonDataDetailDialog';
import { ItemSearchDialog } from '@/app/Item/components/ItemSearchDialog';
import { getAnswerDate } from '@/utils/getAnswerDate';
import { numberFormat } from '@/utils';

export interface CommonDetailDialogProps<T> {
  title: string;
  slug: string;
  isShown: boolean;
  state: T;
  fraction: number;
  salesTaxRate: number;
  customerRate?: number;
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

const roundTaxAlwaysCeil = (v: number): number => {
  if (!Number.isFinite(v)) return 0;
  return Math.ceil(v);
};

const calcAmountIncludedTaxAlwaysCeil = (
  unitPriceAny: any,
  quantityAny: any,
  discountAny: any,
  salesTaxRateAny: any
) => {
  const unitPrice = toNumber(unitPriceAny ?? 0);
  const quantity = toNumber(quantityAny ?? 0);
  const discount = toNumber(discountAny ?? 0);
  const taxRate = toNumber(salesTaxRateAny ?? 0);

  const subtotal = unitPrice * quantity;
  const amountRaw = subtotal - discount;
  const amount = Math.round(amountRaw > 0 ? amountRaw : 0);

  const sales_tax = taxRate > 0
    ? roundTaxAlwaysCeil((amount * taxRate) / (100 + taxRate))
    : 0;

  return {
    amount,
    sales_tax,
    sales_tax_rate: taxRate,
  };
};

export const CommonDataDetailDialog: DataDetailDialog = ({
  title,
  slug,
  isShown,
  state,
  fraction,
  salesTaxRate,
  customerRate,
  showAnswerDate,
  receiveOrderDate,
  updateState,
  selectedFuncBefore,
  onSelected,
  onDeleted,
  onCancel,
}) => {
  const { errors, setErrors, save } = useCommonDataDetailDialog(slug);

  const recalc = (
    unitPrice: number | undefined,
    quantity: number | undefined,
    discount: number | undefined
  ) => {
    return calcAmountIncludedTaxAlwaysCeil(unitPrice, quantity, discount, salesTaxRate);
  };

  const { open: openItemDialog, searchDialogProps: itemSearchDialogProps } =
    useCommonSearchDialogProps<Item>(
      'item',
      async props => {
        const p: any = props as any;

        const itemNumber: string = (p.item_number ?? p.itemNo ?? p.item_no ?? p.code ?? '') as string;
        const domesticStocks: number = toNumber(p.domestic_stocks ?? p.domestic_stock ?? p.domesticStock ?? 0);
        const overseasStocks: number = toNumber(p.overseas_stocks ?? p.overseas_stock ?? p.overseasStock ?? 0);

        const {
          id,
          name,
          name_note,
          sales_price,
          sales_unit_price,
          is_set_item,
          shipping_pay,
          is_shipping_fee,
          additional_shipping_fee,
        } = p;

        const salesUnitPriceNum = toNumber(sales_price ?? sales_unit_price ?? 0);
        const rateForCalc = toNumber((state as any).rate ?? customerRate ?? 100);
        const unit_price = Math.round(((salesUnitPriceNum * rateForCalc) / 100) * 100) / 100;
        const discount = toNumber((state as any).discount ?? 0);
        const ret = recalc(unit_price, 1, discount);

        let answer_date: string | undefined = undefined;
        if (showAnswerDate) {
          answer_date = getAnswerDate(receiveOrderDate, domesticStocks, overseasStocks);
        }

        updateState({
          item_kind: is_set_item ? 2 : 1,
          item_id: id,
          item_number: itemNumber,
          item_name: name,
          item_name_jp: name_note,

          sales_unit_price: salesUnitPriceNum,
          rate: rateForCalc,
          unit_price,

          quantity: 1,
          discount,

          ...ret,

          answer_date,
          shipping_pay: toNumber(shipping_pay ?? 0),
          is_shipping_fee,
          additional_shipping_fee: toNumber(additional_shipping_fee ?? 0),
        } as any);

        setErrors(undefined);
        return true;
      },
      selectedFuncBefore
    );

  useEffect(() => {
    if (!isShown) return;

    setErrors(undefined);

    const initialRate = toNumber(customerRate ?? 100);

    if (
      !(state as any).no &&
      ((state as any).rate === undefined || (state as any).rate === null || (state as any).rate === '')
    ) {
      updateState({ rate: initialRate } as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShown]);

  const onChange = (name: string, value: string | number | boolean | undefined) => {
    if (name === 'answer_date' && (typeof value === 'string' || typeof value === 'undefined')) {
      updateState({ [name]: value } as any);
      setErrors({ ...(errors as any), [name]: '' });
      return;
    }

    if (
      (name === 'item_name' || name === 'item_name_jp') &&
      (typeof value === 'string' || typeof value === 'undefined')
    ) {
      updateState({ [name]: value } as any);
      if (errors && (errors as any)[name]) setErrors({ ...(errors as any), [name]: '' });
    }
  };

  const onChangeRate = (name: string, value: string | number | boolean | undefined) => {
    const rate = value === '' || value === undefined ? undefined : toNumber(value);

    const s = toNumber((state as any).sales_unit_price ?? 0);
    const r = rate ?? 100;
    const unit_price = Math.round(((s * r) / 100) * 100) / 100;

    const ret = recalc(unit_price, (state as any).quantity as any, (state as any).discount as any);

    updateState({ [name]: rate, unit_price, ...ret } as any);
    if (errors && (errors as any)[name]) setErrors({ ...(errors as any), [name]: '' });
  };

  const onChangeUnitPrice = (name: string, value: string | number | boolean | undefined) => {
    const unitPrice = value === '' || value === undefined ? undefined : toNumber(value);
    const ret = recalc(unitPrice, (state as any).quantity as any, (state as any).discount as any);

    updateState({ [name]: unitPrice, ...ret } as any);
    setErrors({ ...(errors as any), unit_price: '' });
  };

  const onChangeQuantity = (name: string, value: string | number | boolean | undefined) => {
    const quantity = value === '' || value === undefined ? undefined : toNumber(value);
    const ret = recalc((state as any).unit_price as any, quantity as any, (state as any).discount as any);

    updateState({ [name]: quantity, ...ret } as any);
    setErrors({ ...(errors as any), quantity: '' });
  };

  const onChangeDetailDiscount = (name: string, value: string | number | boolean | undefined) => {
    const discount = value === '' || value === undefined ? 0 : toNumber(value);
    const ret = recalc((state as any).unit_price as any, (state as any).quantity as any, discount);

    updateState({ [name]: discount, ...ret } as any);
    setErrors({ ...(errors as any), discount: '' });
  };

  const validateBeforeSave = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!(state as any).item_id) nextErrors.item_id = '品番を選択してください。';

    const unitPriceNum =
      (state as any).unit_price === undefined || (state as any).unit_price === null
        ? NaN
        : toNumber((state as any).unit_price);

    if (Number.isNaN(unitPriceNum)) nextErrors.unit_price = '単価を入力してください。';
    else if (unitPriceNum < 0) nextErrors.unit_price = '単価は0以上で入力してください。';

    const qtyNum =
      (state as any).quantity === undefined || (state as any).quantity === null
        ? NaN
        : toNumber((state as any).quantity);

    if (Number.isNaN(qtyNum)) nextErrors.quantity = '数量を入力してください。';
    else if (qtyNum < 1) nextErrors.quantity = '数量は1以上で入力してください。';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return false;
    }

    return true;
  };

  const onClickSave = () => {
    if (!validateBeforeSave()) return;

    const snapshot = { ...(state as any) };
    save(snapshot).then(ret => {
      if (ret) onSelected(snapshot);
    });
  };

  const onClickDelete = () => {
    if ((state as any).no) onDeleted((state as any).no);
  };

  return (
    <DialogWrapper title={`${title}明細`} isShown={isShown} onClickCancel={onCancel}>
      <div className="form-group-wrapper">
        <div>
          <Forms.FormGroup labelText="品番" required error={(errors as any)?.item_id} groupClassName="mt-0">
            <div className="flex">
              <Forms.FormInputText
                name="item_number"
                value={(state as any).item_number ?? ''}
                error={(errors as any)?.item_id}
                className="max-w-lg"
                readOnly
              />
              <input type="hidden" name="item_id" value={(state as any).item_id ?? ''} />
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
          value={(state as any).item_name ?? ''}
          onChange={onChange}
          removeOptionalLabel
        />

        <Forms.FormGroupInputText
          labelText="商品名（納品書）"
          name="item_name_jp"
          value={(state as any).item_name_jp ?? ''}
          onChange={onChange}
          removeOptionalLabel
        />

        <div className="w-1/2">
          <Forms.FormGroupInputText
            labelText="定価"
            name="sales_unit_price"
            value={numberFormat((state as any).sales_unit_price, 2)}
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
            value={(state as any).rate ?? ''}
            error={(errors as any)?.rate}
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
            value={(state as any).unit_price}
            error={(errors as any)?.unit_price}
            onChange={onChangeUnitPrice}
            precision={2}
            required
            min={0}
            readOnly={(state as any).item_kind !== 1}
          />
        </div>

        <div className="w-1/2">
          <Forms.FormGroupInputNumber
            labelText="数量"
            name="quantity"
            value={(state as any).quantity}
            error={(errors as any)?.quantity}
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
            value={(state as any).discount ?? 0}
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
              value={numberFormat((state as any).amount, 0)}
              className="max-w-8 text-right"
              readOnly
              removeOptionalLabel
            />
          </div>
          <div className="w-1/2">
            <Forms.FormGroupInputText
              labelText="消費税"
              name="sales_tax"
              value={numberFormat((state as any).sales_tax, 0)}
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
              value={(state as any).answer_date ?? ''}
              error={(errors as any)?.answer_date}
              onChange={onChange}
            />
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-between">
        <button className="btn" onClick={onClickSave}>
          保存
        </button>
        {(state as any)?.no != undefined && (
          <button className="btn-delete" onClick={onClickDelete}>
            削除
          </button>
        )}
      </div>
    </DialogWrapper>
  );
};
