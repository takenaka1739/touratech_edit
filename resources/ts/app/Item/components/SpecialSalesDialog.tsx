//import React, { useMemo } from 'react';
import { SpecialSale } from '@/types';
//import { TableWrapper, BoxConditions, DialogWrapper, Forms } from '@/components';
import { DialogWrapper } from '@/components';
//import { useCommonSearchDialog } from '@/app/App/uses/useCommonSearchDialog';
import { Forms } from '@/components';
//import { useSpecialSalesPage } from '../uses/useSpecialSalesPage';
import { useSpecialSalesPage } from '@/app/Item/uses/useSpecialSalesPage';
//import { numberFormat } from '@/utils/numberFormat';
//import { useComposing } from '@/uses';
//import axios from 'axios';
//import { RouteComponentProps } from 'react-router-dom';
//import { PageWrapper, Forms } from '@/components';

/**
 * 商品マスタ（検索）画面 Component
 *
 * @param props
 */

//type SpecialSalesProps = {
//  isShown: boolean;
//  isSetItem?: boolean | undefined;
//  onCancel: () => void;
//  onClickCancel: () => void;
//} & RouteComponentProps<{ id: string }>;

//type props = {
//  id: number | undefined,
//  item_id: number | undefined,
//  is_sales_members_only: boolean | undefined,
//  start_at: string | undefined,
//  end_at: string | undefined,
//  special_sale_price: number | undefined,
//  refund_rate: number | undefined,
//}

type SpecialSalesProps = {
  isShown: boolean;
  isSetItem?: boolean | undefined;

  id: number | undefined,
  item_id: number | undefined,
  is_sales_members_only: boolean | undefined,
  start_at: string | undefined,
  end_at: string | undefined,
  special_sale_price: number | undefined,
  refund_rate: number | undefined,
}

//export const SpecialSalesDialog: React.VFC<SpecialSalesProps & props> = ({
export const SpecialSalesDialog: React.VFC<SpecialSalesProps> = (a, {
  //isShown,
}) => {
  const {
    state,
    onClickCancel,
    onChange,
    errors,
  } = useSpecialSalesPage<SpecialSale>({
      id: a.id,
      item_id: a.item_id,
      is_sales_members_only: a.is_sales_members_only,
      start_at: a.start_at,
      end_at: a.end_at,
      special_sale_price: a.special_sale_price,
      refund_rate: a.refund_rate,
  })

  console.dir('SpecialSalesDialog.state');
  console.dir(state, { depth: null });
  console.dir(a, { depth: null });

  console.dir(a.end_at);

  return (
    <DialogWrapper title="特売設定"
    //isShown={isShown && !isLoading}
    isShown={a.isShown}
    onClickCancel={onClickCancel}
    >
      <div className="w-40 mt-2">
        <div className="form-group">
          <Forms.FormGroup
            labelText="会員専用販売"
            error={errors?.is_discontinued}
            groupClassName="items-center mt-4"
          >
            <Forms.FormInputCheck
              id="is_discontinued"
              name="is_discontinued"
              checked={a.is_sales_members_only}
              onChange={onChange}
            />
          </Forms.FormGroup>
        </div>
      </div>
      <Forms.FormGroupInputDate
        labelText="開始日"
        name="start_at"
        value={a.start_at}
        onChange={onChange}
        required
      />
      <Forms.FormGroupInputDate
        labelText="終了日"
        name="end_at"
        value={a.end_at}
        onChange={onChange}
        required
      />
      <div className="w-1/2">
        <Forms.FormGroupInputNumber
          labelText="特売価格"
          name="special_sale_price"
          value={a.special_sale_price}
          error={errors?.special_sale_price}
          onChange={onChange}
          precision={2}
          className="max-w-8"
          min={0}
        />
      </div>
      <div className="w-1/2" style={{display: 'flex'}}>
        <Forms.FormGroupInputNumber
          labelText="ポイント還元の設定"
          name="sample_price"
          value={a.refund_rate}
          error={errors?.refund_rate}
          onChange={onChange}
          precision={2}
          className="max-w-8"
          min={0}
        />
        <label style={{height:'10px', width: '100px', verticalAlign: 'bottom', padding: '0px'}}>ポイント</label>
      </div>
      <div className="flex justify-between">
        <div>
          <button className="btn"> {/*onClick={onClickSave} disabled={isDisabled}>*/}
            設定
          </button>
        </div>
        {/*{id &&*/} { (
          <button className="btn-delete"> {/*onClick={onClickDelete} disabled={isDisabled}>*/}
            削除
          </button>
        )}
      </div>
    </DialogWrapper>
  )
};

