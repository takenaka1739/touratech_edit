import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { PlaceOrder, PlaceOrderDetail, User, PageErrors } from '@/types';
import { appAlert, appConfirm } from '@/components';
import { useCommonSearchDialogProps } from '@/app/App/uses/useCommonSearchDialogProps';
import { usePlaceOrderDetailDialogProps } from './usePlaceOrderDetailDialogProps';
import { useConfig } from '@/app/App/uses/useApp';
import { AppActions } from '@/app/App/modules/appModule';
import { calcAmount, getSalesTaxRate } from '@/utils';
import { useIdFromParams } from '@/uses';
import { getMailConfirm } from '../utils/getMailConfirm';

export const placeOrderDetailInitialState: PlaceOrderDetail = {
  id: undefined,
  place_order_id: undefined,
  no: undefined,
  item_kind: undefined,
  item_id: undefined,
  item_number: '',
  item_name: '',
  item_name_jp: '',
  unit_price: undefined,
  quantity: 1,
  amount: undefined,
  sales_tax_rate: undefined,
  sales_tax: undefined,
  fraction: 3,
  receive_order_detail_id: undefined,
};

type PlaceOrderDetailPageState = PlaceOrder & {
  details_amount: number;
  fraction: number;
  prev_title: string | undefined;
  prev_url: string;
};

/**
 * 発注データ（詳細）画面用 hooks
 */
export const usePlaceOrderDetailPage = (slug: string, from_receive: boolean) => {
  const id = useIdFromParams();
  const dispatch = useDispatch();
  const [state, setState] = useState<PlaceOrderDetailPageState>({
    id: undefined,
    place_order_date: '',
    user_id: undefined,
    user_name: undefined,
    delivery_day: undefined,
    total_amount: 0,
    remarks: undefined,
    sales_tax_rate: undefined,
    details: [],
    details_amount: 0,
    fraction: 3,
    prev_title: from_receive ? '受注状況一覧' : undefined,
    prev_url: from_receive ? '/receive_order_status' : `/${slug}`,
  });
  const [errors, setErrors] = useState<PageErrors>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const history = useHistory();
  const config = useConfig();
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

  const {
    open: openReceiveOrderDialog,
    searchDialogProps: receiveOrderSearchDialogProps,
  } = useCommonSearchDialogProps<any>(
    'receive_order',
    async props => {
      const { total_amount, remarks, fraction, receive_order_id, details } = props;
      setState({
        ...state,
        details,
        total_amount,
        remarks,
        fraction,
        receive_order_id,
      });
      setErrors(undefined);
      return true;
    },
    undefined,
    'selected_for_place'
  );

  const backPage = () => history.push(state.prev_url);

  const getRate: (sales_date: string | undefined) => number = sales_date => {
    return getSalesTaxRate(sales_date, config);
  };

  const updateDetails: (details: PlaceOrderDetail[], details_amount: number) => void = (
    details,
    details_amount
  ) => {
    const total_amount = details_amount;
    setState({ ...state, details, total_amount, details_amount });
  };

  const { open, detailDialogProps } = usePlaceOrderDetailDialogProps(
    state.details,
    placeOrderDetailInitialState,
    updateDetails
  );

  const get: (id: number | undefined) => Promise<boolean> = async id => {
    dispatch(AppActions.request());

    let url = '';
    let receive_order_id = undefined;
    if (from_receive) {
      url = `/api/${slug}/edit_by_receive_id/${id}`;
      receive_order_id = id;
    } else {
      url = `/api/${slug}/edit/${id ?? ''}`;
    }
    const res = await axios.get(url);

    if (res.status === 200) {
      const { place_order_date } = res.data.data;
      const sales_tax_rate = getRate(place_order_date);
      if (from_receive) {
        setState({ ...state, ...res.data.data, sales_tax_rate, receive_order_id });
      } else {
        setState({ ...state, ...res.data.data, sales_tax_rate });
      }

      dispatch(AppActions.success());
      return true;
    } else {
      // dispatch(AppActions.failed('データの取得に失敗しました。'));
      dispatch(AppActions.success());
      history.push('/404');
    }
    return false;
  };

  const getMail: (id: number) => Promise<string> = async id => {
    dispatch(AppActions.request());
    const res = await axios.post(`/api/${slug}/get_mail`, { id });
    if (res.status === 200) {
      if (res.data.success) {
        dispatch(AppActions.success());
        return res.data.data.mail;
      } else {
        dispatch(AppActions.failed('メールの取得に失敗しました。'));
      }
    } else {
      dispatch(AppActions.failed('メールの取得に失敗しました。'));
    }
    return false;
  };

  const sendingMail: (id: number) => Promise<boolean> = async id => {
    dispatch(AppActions.request());
    const res = await axios.post(`/api/${slug}/sending_mail`, { id });
    if (res.status === 200) {
      if (res.data.success) {
        dispatch(AppActions.success());
        return true;
      } else {
        dispatch(AppActions.failed('メールの送信に失敗しました。'));
      }
    } else {
      dispatch(AppActions.failed('メールの送信に失敗しました。'));
    }
    return false;
  };

  const store: () => Promise<boolean> = async () => {
    dispatch(AppActions.request());
    const res = await axios.post(`/api/${slug}/store`, state);

    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        setErrors(undefined);
        if (res.data.data?.hasOrderMail) {
          if (await appConfirm('得意先に納期日数の連絡メールを送信しますか？')) {
            const mail = await getMail(res.data.data?.id);
            if (await appConfirm(getMailConfirm(mail))) {
              return await sendingMail(res.data.data?.id);
            }
          }
        }

        return true;
      } else {
        setErrors(res.data.errors);
      }
    } else {
      dispatch(AppActions.failed('データの保存に失敗しました。'));
    }
    return false;
  };

  const edit: (id: number) => Promise<boolean> = async id => {
    dispatch(AppActions.request());
    const res = await axios.put(`/api/${slug}/edit/${id}`, state);

    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        if (res.data.data?.hasOrderMail) {
          if (await appConfirm('得意先に納期日数の連絡メールを送信しますか？')) {
            const mail = await getMail(id);
            if (await appConfirm(getMailConfirm(mail))) {
              return await sendingMail(id);
            }
          }
        }

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
      return true;
    } else {
      dispatch(AppActions.failed('データの削除に失敗しました。'));
    }
    return false;
  };

  useEffect(() => {
    get(id).then(ret => {
      if (ret) {
        setIsLoading(false);
      }
    });
  }, [id]);

  const onChange: (name: string, value: string | number | boolean | undefined) => void = (
    name,
    value
  ) => {
    setState({ ...state, [name]: value });
    setErrors({ ...errors, [name]: '' });
  };

  const onChangeDateWidthCalc: (
    name: string,
    value: string | number | boolean | undefined
  ) => void = (name, value) => {
    if (typeof value === 'string' || typeof value === 'undefined') {
      const sales_tax_rate = getRate(value);
      if (sales_tax_rate !== state.sales_tax_rate) {
        const details = state.details.map(x => {
          const { amount, sales_tax } = calcAmount(
            x.unit_price,
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
      setErrors({ ...errors, [name]: '' });
    }
  };

  const onClickAddDetail: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void = () => {
    open(undefined, state.fraction);
  };

  const onClickEditDetail: (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => void = e => {
    open(e.currentTarget.dataset.id, state.fraction);
  };

  const onClickSave: () => void = async () => {
    if (id && !from_receive) {
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
        }
      }
    }
  };

  return {
    isLoading,
    id,
    state,
    errors,
    userSearchDialogProps,
    receiveOrderSearchDialogProps,
    detailDialogProps,
    openUserDialog,
    openReceiveOrderDialog,
    onChange,
    onChangeDateWidthCalc,
    onClickAddDetail,
    onClickEditDetail,
    onClickSave,
    onClickDelete,
  };
};
