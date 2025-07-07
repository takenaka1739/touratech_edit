import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import toNumber from 'lodash/toNumber';
import { Customer, User, PageErrors, CommonData, CommonDataDetail } from '@/types';
import { appAlert, appConfirm } from '@/components';
import { useCommonSearchDialogProps } from '@/app/App/uses/useCommonSearchDialogProps';
import { useCommonDataDetailDialogProps } from '@/app/App/uses/useCommonDataDetailDialogProps';
import { useConfig } from '@/app/App/uses/useApp';
import { AppActions } from '@/app/App/modules/appModule';
import {
  calcAmount,
  calcTotalAmount,
  calcUnitPrice,
  getCodAmount,
  getShippingAmount,
  getSalesTaxRate,
} from '@/utils';
import { useIdFromParams } from '@/uses';
import { CorporateClass } from '@/constants/CorporateClass';

export const detailinitialState: CommonDataDetail = {
  id: undefined,
  no: undefined,
  item_kind: 1,
  item_id: undefined,
  item_number: '',
  item_name: '',
  item_name_jp: '',
  sales_unit_price: undefined,
  rate: 100,
  unit_price: undefined,
  quantity: 1,
  amount: undefined,
  sales_tax_rate: undefined,
  sales_tax: undefined,
  fraction: 1,
};

interface CommonDataDetailPage extends CommonData {
  details_amount: number;
  barcode: string | undefined;
}

/**
 * データ（詳細）画面共通 hooks
 */
export const useCommonDataDetailPage = <T extends CommonDataDetailPage>(
  slug: string,
  initialState: T,
  back_url?: string | undefined
) => {
  const id = useIdFromParams();
  const dispatch = useDispatch();
  const [state, setState] = useState<T>(initialState);
  const [errors, setErrors] = useState<PageErrors>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const history = useHistory();
  const config = useConfig();

  // 得意先ダイアログ
  const {
    open: openCustomerDialog,
    searchDialogProps: customerSearchDialogProps,
  } = useCommonSearchDialogProps<Customer>('customer', async props => {
    const {
      id,
      name,
      zip_code,
      address1,
      address2,
      tel,
      fax,
      fraction,
      corporate_class,
      rate,
    } = props;
    setState({
      ...state,
      customer_id: id,
      customer_name: name,
      name,
      zip_code,
      address1,
      address2,
      tel,
      fax,
      fraction,
      corporate_class,
      rate,
      send_flg: true,
    });
    setErrors({ ...errors, name: '', zip_code: '', address1: '', tel: '' });
    return true;
  });

  // 担当者ダイアログ
  const {
    open: openUserDialog,
    searchDialogProps: userSearchDialogProps,
  } = useCommonSearchDialogProps<User>('user', async props => {
    setState({
      ...state,
      user_id: props?.id,
      user_name: props?.name,
    });
    return true;
  });

  const backPage = () => history.push(back_url ?? `/${slug}`);

  /**
   * ajaxで取得したデータをstateに合うように整形する
   *
   * @param data
   * @returns
   */
  const toState: <V extends CommonDataDetailPage>(data: V) => any = data => {
    const { shipping_amount, fee, discount, total_amount, details, ...props } = data;
    const details_amount = details.reduce((x, y) => {
      return x + toNumber(y.amount ?? 0);
    }, 0);
    return {
      ...props,
      shipping_amount,
      fee,
      discount,
      total_amount: toNumber(total_amount),
      details,
      details_amount,
    };
  };

  /**
   * stateを更新する
   *
   * @param props 更新する項目の値
   */
  const updateState: <K extends keyof T>(
    props: {
      [key in K]?: T[K];
    }
  ) => void = props => {
    setState({ ...state, ...props });
  };

  /**
   * 消費税を取得する
   *
   * @param date 対象日付
   * @returns 消費税
   */
  const getRate: (date: string | undefined) => number = date => {
    return getSalesTaxRate(date, config);
  };

  /**
   * stateの明細を更新する
   *
   * @param details
   * @param details_amount
   */
  const updateDetails: <V>(details: V[], details_amount: number) => void = (
    details,
    details_amount
  ) => {
    const shipping_amount = getShippingAmount(details_amount, state.rate, config);
    const fee =
      state.corporate_class === CorporateClass.CashOnDelivery
        ? getCodAmount(details_amount, config)
        : state.fee;
    const total_amount = calcTotalAmount(
      details_amount,
      shipping_amount ?? 0,
      fee ?? 0,
      state.discount ?? 0,
      state.fraction
    );
    setState({ ...state, details, shipping_amount, fee, total_amount, details_amount });
    setErrors({ ...errors, details: '' });
  };

  // 明細ダイアログ
  const { open, detailDialogProps } = useCommonDataDetailDialogProps(
    state.details,
    detailinitialState,
    updateDetails
  );

  const store: () => Promise<number> = async () => {
    dispatch(AppActions.request());
    const res = await axios.post(`/api/${slug}/store`, state);

    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        setErrors(undefined);
        return res.data.data.id;
      } else {
        setErrors(res.data.errors);
      }
    } else {
      dispatch(AppActions.failed('データの保存に失敗しました。'));
    }
    return 0;
  };

  const edit: (id: number) => Promise<boolean> = async id => {
    dispatch(AppActions.request());
    const res = await axios.put(`/api/${slug}/edit/${id}`, state);

    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        setErrors(undefined);
        return true;
      } else {
        setErrors(res.data.errors);
      }
    } else {
      dispatch(AppActions.failed('データの保存に失敗しました。'));
    }
    return false;
  };

  const destroy: (id: number) => Promise<boolean> = async id => {
    dispatch(AppActions.request());
    const res = await axios.delete(`/api/${slug}/delete/${id}`);

    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        setErrors(undefined);
        return true;
      } else {
        setErrors(res.data.errors);
      }
    } else {
      dispatch(AppActions.failed('データの削除に失敗しました。'));
    }
    return false;
  };

  const storeCustomer: () => Promise<boolean> = async () => {
    dispatch(AppActions.request());
    const res = await axios.post('/api/customer/simple_store', state);

    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        setState({ ...state, customer_id: res.data.data.id, customer_name: state.name });
        return true;
      } else {
        setErrors(res.data.errors);
      }
    } else {
      dispatch(AppActions.failed('得意先の追加に失敗しました。'));
    }
    return false;
  };

  /**
   * バーコードで読み取った品番から明細を追加する
   *
   * @returns
   */
  const addDetail: () => Promise<boolean> = async () => {
    if (!state.barcode) {
      return false;
    }
    if (state.details.some(x => x.item_number === state.barcode)) {
      countUpDetail(state.barcode);
      return true;
    }

    dispatch(AppActions.request());
    const res = await axios.post(`/api/item/get_detail`, { barcode: state.barcode });

    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        const { id, item_number, name, name_jp, sales_unit_price, is_set_item } = res.data.data;
        const unit_price = calcUnitPrice(sales_unit_price ?? 0, state.rate ?? 0, state.fraction);
        const ret = calcAmount(unit_price, 1, state.sales_tax_rate ?? 0, state.fraction);

        let details = [
          ...state.details,
          {
            item_kind: is_set_item ? 2 : 1,
            item_id: id,
            item_number,
            item_name: name,
            item_name_jp: name_jp,
            sales_unit_price,
            rate: state.rate,
            unit_price,
            quantity: 1,
            sales_tax_rate: state.sales_tax_rate,
            fraction: state.fraction,
            ...ret,
          } as CommonDataDetail,
        ];
        details = details.map((x, i) => {
          return { ...x, no: i + 1 };
        });
        const details_amount = details.reduce((x, y) => {
          return x + toNumber(y.amount ?? 0);
        }, 0);
        const shipping_amount = getShippingAmount(details_amount, state.rate, config);
        const fee =
          state.corporate_class === CorporateClass.CashOnDelivery
            ? getCodAmount(details_amount, config)
            : state.fee;
        const total_amount = calcTotalAmount(
          details_amount,
          shipping_amount ?? 0,
          fee ?? 0,
          state.discount ?? 0,
          state.fraction
        );
        setState({
          ...state,
          details,
          details_amount,
          shipping_amount,
          fee,
          total_amount,
          barcode: undefined,
        });
        setErrors({ ...res.data.errors, barcode: undefined });

        return true;
      } else {
        setErrors(res.data.errors);
      }
    } else {
      dispatch(AppActions.failed('データの取得に失敗しました。'));
    }
    return false;
  };

  /**
   * 既存の明細の数量をカウントアップする
   *
   * @param $item_number 対象品番
   */
  const countUpDetail = ($item_number: string) => {
    const details = state.details.map(x => {
      if (x.item_number === $item_number) {
        const quantity = (x.quantity ?? 0) + 1;
        const ret = calcAmount(x.unit_price, quantity, x.sales_tax_rate ?? 0, x.fraction);
        return { ...x, quantity, ...ret };
      } else {
        return { ...x };
      }
    });
    const details_amount = details.reduce((x, y) => {
      return x + toNumber(y.amount ?? 0);
    }, 0);
    const shipping_amount = getShippingAmount(details_amount, state.rate, config);
    const fee =
      state.corporate_class === CorporateClass.CashOnDelivery
        ? getCodAmount(details_amount, config)
        : state.fee;
    const total_amount = calcTotalAmount(
      details_amount,
      shipping_amount ?? 0,
      fee ?? 0,
      state.discount ?? 0,
      state.fraction
    );
    setState({
      ...state,
      details,
      details_amount,
      shipping_amount,
      fee,
      total_amount,
      barcode: undefined,
    });
  };

  /**
   * 日付を更新する（消費税も更新する）
   *
   * @param name
   * @param value
   */
  const onChangeDateWidthCalc = (name: string, value: string | number | boolean | undefined) => {
    if (typeof value === 'string' || typeof value === 'undefined') {
      const sales_tax_rate = getRate(value);
      if (sales_tax_rate !== state.sales_tax_rate) {
        const details = state.details.map(x => {
          const { amount, sales_tax } = calcAmount(
            x.sales_unit_price,
            x.quantity,
            sales_tax_rate,
            state.fraction
          );
          return { ...x, amount, sales_tax };
        });
        setState({ ...state, [name]: value, sales_tax_rate, details });
      } else {
        setState({ ...state, [name]: value });
      }
    }
  };

  const onChange = (name: string, value: string | number | boolean | undefined) => {
    setState({ ...state, [name]: value });
    setErrors({ ...errors, [name]: '' });
  };

  /**
   * 送料を更新する
   *
   * @param name
   * @param value
   */
  const onChangeShippingAmount = (name: string, value: string | number | boolean | undefined) => {
    const shipping_amount = toNumber(value);
    const total_amount = calcTotalAmount(
      state.details_amount,
      shipping_amount,
      state.fee ?? 0,
      state.discount ?? 0,
      state.fraction
    );
    setState({ ...state, [name]: shipping_amount, total_amount });
  };

  /**
   * 手数料を更新する
   *
   * @param name
   * @param value
   */
  const onChangeFee = (name: string, value: string | number | boolean | undefined) => {
    const fee = toNumber(value);
    const total_amount = calcTotalAmount(
      state.details_amount,
      state.shipping_amount ?? 0,
      fee,
      state.discount ?? 0,
      state.fraction
    );
    setState({ ...state, [name]: fee, total_amount });
  };

  /**
   * 値引を更新する
   *
   * @param name
   * @param value
   */
  const onChangeDiscount = (name: string, value: string | number | boolean | undefined) => {
    const discount = toNumber(value);
    const total_amount = calcTotalAmount(
      state.details_amount,
      state.shipping_amount ?? 0,
      state.fee ?? 0,
      discount,
      state.fraction
    );
    setState({ ...state, [name]: discount, total_amount });
  };

  const onClickSave: () => void = async () => {
    if (id) {
      if (await edit(id)) {
        await appAlert('保存しました。');
        backPage();
      } else {
        window.scrollTo(0, 0);
      }
    } else {
      if (await store()) {
        await appAlert('保存しました。');
        backPage();
      } else {
        window.scrollTo(0, 0);
      }
    }
  };

  const onClickDelete: () => void = async () => {
    if (id) {
      if (await appConfirm('削除します。よろしいですか？')) {
        if (await destroy(id)) {
          await appAlert('削除しました。');
          backPage();
        } else {
          window.scrollTo(0, 0);
        }
      }
    }
  };

  const onClickAddDetail: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void = () => {
    open(undefined, state.rate, state.fraction);
  };

  const onClickEditDetail: (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => void = e => {
    open(e.currentTarget.dataset.no, state.rate, state.fraction);
  };

  const onClickBarcode: () => void = async () => {
    await addDetail();
  };

  const onClickCreateCustomer: () => void = async () => {
    if (await storeCustomer()) {
      await appAlert('得意先を新規に追加しました。');
    }
  };

  return {
    isLoading,
    id,
    state,
    errors,
    history,
    customerSearchDialogProps,
    userSearchDialogProps,
    detailDialogProps,
    openCustomerDialog,
    openUserDialog,
    setIsLoading,
    setState,
    setErrors,
    toState,
    updateState,
    store,
    edit,
    destroy,
    getRate,
    updateDetails,
    backPage,
    onChangeDateWidthCalc,
    onChange,
    onChangeShippingAmount,
    onChangeFee,
    onChangeDiscount,
    onClickSave,
    onClickDelete,
    onClickAddDetail,
    onClickEditDetail,
    onClickBarcode,
    onClickCreateCustomer,
  };
};
