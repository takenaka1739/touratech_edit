//import React, { useMemo } from 'react';
import { SpecialSale } from '@/types';
//import { TableWrapper, BoxConditions, DialogWrapper, Forms } from '@/components';
import { DialogWrapper } from '@/components';
//import { useCommonSearchDialog } from '@/app/App/uses/useCommonSearchDialog';
import { Forms } from '@/components';
//import { useSpecialSalesPage } from '../uses/useSpecialSalesPage';
//import { useSpecialSalesPage } from '@/app/Item/uses/useSpecialSalesPage';
import { useEffect } from 'react';
import { useState } from 'react';
import { PageErrors } from '@/types';

//import { useEffect, useState } from 'react';
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
  state: any;
  isShown: boolean;
  isLoading: boolean;
  isSetItem?: boolean | undefined;

  //id: number | undefined;
  //item_id: number | undefined;
  //is_sales_members_only: boolean | undefined;
  //start_at?: string | undefined;
  //end_at?: string | undefined;
  //special_sale_price?: number | undefined;
  //refund_rate?: number | undefined;

  onValueChange: (value: SpecialSale) => void;
  onClickCancel: () => void;
}

//type props = {
//  onValueChange: (value: SpecialSale) => void;
//}

//export const SpecialSalesDialog: React.VFC<SpecialSalesProps & props> = ({
//export const SpecialSalesDialog: React.VFC<SpecialSalesProps> = (inisial, {onValueChange
//export const SpecialSalesDialog: React.VFC<SpecialSalesProps> = (inisial, {}
//  //isShown,
//) => {
//  const {
//    state,
//    isShown,
//    //isLoading,
//    onClickCancel,
//    onChange,
//    setState,
//    setIsShown,
//    setIsLoading,
//    errors,
//  } = useSpecialSalesPage<SpecialSale>(
//    inisial
//  )
//
//  console.log('クリック2');
//
//  console.log(inisial.isShown);
//  //console.log(isShown);
//
//  const [reIsShown, setReIsShown] = useState(inisial.isShown);
//
//  useEffect(() => {setState(inisial)}, [inisial]);
//useEffect(() => {
//  setIsShown(inisial.isShown);
//  // isShown が true のときだけ reIsShown を true にする
//  //if (inisial.isShown) {
//  //  setReIsShown(true);
//  //}else{
//  //  setReIsShown(false);
//  //}
//}, [inisial.isShown]);
//
//  useEffect(() => {setReIsShown(isShown)}, []);
//  useEffect(() => {setIsLoading(inisial.isLoading)}, [inisial.isLoading]);
//  
//  console.log(inisial.isShown);
//  console.log(isShown);
//  console.log(reIsShown);
//
//  const onSettClick = () => {
//    inisial.onValueChange(state);
//    onClickCancel();
//  }
//
//  const onDiClickCancel = () => {
//    //setReIsShown(false);
//    onClickCancel();
//  }
export const SpecialSalesDialog: React.VFC<SpecialSalesProps> = ({
  isShown,
  //isLoading,
  onClickCancel,
  onValueChange,
  state,
  //id,
  //item_id,
  //is_sales_members_only,
  //start_at,
  //end_at,
  //special_sale_price,
  //refund_rate,
}) => {

  const [initialState, setState] = useState(state);
  const [errors, setErrors] = useState<PageErrors>(undefined);

  useEffect(() => {setState(state)}, [state]);

  const onChange = (name: string, value: string | number | boolean | undefined) => {
    setState((prev: any) => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const onSettClick = () => {
    console.log('セット');
    console.dir(initialState.special_sale_delete);
    onValueChange(initialState);
    onClickCancel();
  };

  const clickCancel = () => {
    initialState.specialSalesDelFlag = false;
    onChange('is_sales_members_only', state.is_sales_members_only);
    onChange('start_at', state.start_at);
    onChange('end_at', state.end_at);
    onChange('special_sale_price', state.special_sale_price);
    onChange('refund_rate', state.refund_rate);
    onClickCancel();
  } 

  const onDeleteClick = () => {
    initialState.specialSalesDelFlag = true;
    onChange('is_sales_members_only', false);
    onChange('start_at', undefined);
    onChange('end_at', undefined);
    onChange('special_sale_price', 0);
    onChange('refund_rate', 0);
  }

  console.log(initialState.special_sale_price);

  return (
    <DialogWrapper title="特売設定"
    //isShown={isShown && !isLoading}
    isShown={isShown}
    onClickCancel={() => clickCancel()}
    >
      <div className="w-40 mt-2">
        <div className="form-group">
          <Forms.FormGroup
            labelText="会員専用販売"
            error={errors?.is_sales_members_only}
            groupClassName="items-center mt-4"
          >
            <Forms.FormInputCheck
              id="is_sales_members_only"
              name="is_sales_members_only"
              checked={initialState.is_sales_members_only}
              onChange={onChange}
            />
          </Forms.FormGroup>
        </div>
      </div>
      <Forms.FormGroupInputDate
        labelText="開始日"
        name="start_at"
        //value={inisial.start_at ? new Date(inisial.start_at) : null}
        value={initialState.start_at ? new Date(initialState.start_at) : null}
        onChange={onChange}
        required
      />
      <Forms.FormGroupInputDate
        labelText="終了日"
        name="end_at"
        //value={inisial.end_at ? new Date(inisial.end_at) : null}
        value={initialState.end_at ? new Date(initialState.end_at) : null}
        onChange={onChange}
        required
      />
      <Forms.FormGroupInputNumber
        labelText="特売価格"
        name="special_sale_price"
        value={initialState.special_sale_price}
        error={errors?.special_sale_price}
        onChange={onChange}
        precision={2}
        className="max-w-8"
        min={0}
      />
      <div style={{ display: 'flex', width: '375px'}}>
        <Forms.FormGroupInputNumber
          labelText="ポイント還元の設定"
          name="refund_rate"
          value={initialState.refund_rate}
          error={errors?.refund_rate}
          onChange={onChange}
          precision={2}
          className="max-w-8"
          min={0}
        />
        <span
          style={{
            marginTop: '20px',
            width: '100px',
            fontSize: '12px',
            padding: '0px',
            lineHeight: '1',
            display: 'inline-block',
            verticalAlign: 'bottom',
            color: '#465165'
          }}
        >
          ポイント
        </span>
      </div>
      {/*<div className="w-1/2" style={{display: 'flex'}}>
        <Forms.FormGroupInputNumber
          labelText="ポイント還元の設定"
          name="refund_rate"
          //value={inisial.refund_rate}
          value={initialState.refund_rate}
          error={errors?.refund_rate}
          onChange={onChange}
          precision={2}
          className="max-w-8"
          min={0}
        />
        <label style={{fontSize: '12px', verticalAlign: 'bottom', padding: '0px', lineHeight: 'normal',
                       display: 'inline-block'}}>ポイント</label>
      </div>*/}
      <div className="flex justify-between">
        <div>
          {/*<button className="btn"> onClick={inisial.onValueChange(state)} disabled={isDisabled}>*/}
          <button className="btn" onClick={() => onSettClick()}> {/*disabled={isDisabled}>*/}
            設定
          </button>
        </div>
        {/*{id &&*/} { (
          <button className="btn-delete" onClick={() => onDeleteClick()}> {/*disabled={isDisabled}>*/}
            削除
          </button>
        )}
      </div>
    </DialogWrapper>
  )
};

