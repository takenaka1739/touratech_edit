//import { useState, useEffect, useCallback } from 'react';
import { useState } from 'react';
import isEqual from 'lodash/isEqual';
import { PageErrors } from '@/types';
//import { SpecialSale } from '@/types';
//import { useDispatch } from 'react-redux';
//import axios from 'axios';
//import { AppActions } from '@/app/App/modules/appModule';
//import isEqual from 'lodash/isEqual';
//import toNumber from 'lodash/toNumber';
//import { Pager } from '@/types';
//import { AppActions } from '../modules/appModule';

// 特売設定画面用 hocks

//interface props {
//  id: number | undefined,
//  item_id: number | undefined,
//  is_sales_members_only: boolean | undefined,
//  start_at: string | undefined,
//  end_at: string | undefined,
//  special_sale_price: number | undefined,
//  refund_rate: number | undefined,
//}

//type props = {
//  specialSaleItem: SpecialSale;
//}

/**
 * 検索画面共通 hooks
 */
export const useSpecialSalesPage = <T>(initialState: T) => {
//export const useSpecialSalesPage = <T extends props>(initialState: T) => {
//export const useSpecialSalesPage = <T extends props>(  id: number | undefined,
//export const useSpecialSalesPage = <T>(
//  item_id: number | undefined
//) => {
  //const [state, setState] = useState<T>(initialState);
  const [state, setState] = useState<T>(initialState);
  const [isShown, setIsShown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [conditions, setConditions] = useState(initialState);
  const [errors, setErrors] = useState<PageErrors>(undefined);

  console.log(`initialState`);
  console.dir(initialState, { depth: null });


  //console.log(`useSpecialSalesPage.state：${item_id}`);
  //console.log(`useSpecialSalesPage.state：${is_sales_members_only}`);
  //console.log(`useSpecialSalesPage.state：${start_at}`);
  //console.log(`useSpecialSalesPage.state：${end_at}`);
  //console.log(`useSpecialSalesPage.state：${special_sale_price}`);
  //console.log(`useSpecialSalesPage.state：${refund_rate}`);

  //const dispatch = useDispatch();

  const onCancel: () => void = () => {
    setIsShown(false)
  };

  const cleanup: () => void = () => {
    clear(false);
    setIsLoading(true);
  };

  //const get: (id: number) => Promise<boolean> = async id => {
  //  dispatch(AppActions.request());
  //  const res = await axios.get(`/api/item/edit/${id}`);
  //  if (res.status === 200) {
  //    setState(res.data.data);
  //    dispatch(AppActions.success());
  //    return true;
  //  } else {
  //    // dispatch(AppActions.failed('データの取得に失敗しました。'));
  //    dispatch(AppActions.success());
  //    //history.push('/404');
  //  }
  //  return false;
  //};

  const clear: (isFetch?: boolean) => void = (isFetch = true) => {
    if (isEqual(initialState, conditions)) {
      return;
    }
    if (isFetch) {
      //fetch(initialState);
    } else {
      setConditions(initialState);
    }
  };

  const onChange: (name: string, value: string | number | boolean | undefined) => void = (
    name,
    value
  ) => {
    setState({ ...state, [name]: value });
    setErrors({ ...errors, [name]: '' });
  };

  const onClickCancel = () => {
    onCancel();
    cleanup();
  };

  console.log('useSpecialSalesPageの中');

  return {
    open: () => setIsShown(true),
    isLoading,
    state,
    errors,
    onChange,
    onClickCancel, 
    searchDialogProps: {
      isShown,
      //onCancel: () => setIsShown(false),
      onCancel
    },
  };
};
