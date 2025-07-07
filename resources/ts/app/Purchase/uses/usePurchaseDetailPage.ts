import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import toNumber from 'lodash/toNumber';
import { Purchase, PurchaseDetail, User, PlaceOrder, PageErrors, PlaceOrderDetail } from '@/types';
import { appAlert, appConfirm } from '@/components';
import { useCommonSearchDialogProps } from '@/app/App/uses/useCommonSearchDialogProps';
import { usePurchaseDetailDialogProps } from './usePurchaseDetailDialogProps';
import { useConfig } from '@/app/App/uses/useApp';
import { AppActions } from '@/app/App/modules/appModule';
import { calcAmount, calcTotalAmount, getSalesTaxRate } from '@/utils';
import { useIdFromParams } from '@/uses';

export const purchaseDetailInitialState: PurchaseDetail = {
  id: undefined,
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
};

type PurchaseDetailPageState = Purchase & {
  details_amount: number;
  fraction: number;
};

/**
 * 仕入データ（詳細）画面用 hooks
 */
export const usePurchaseDetailPage = (slug: string) => {
  const id = useIdFromParams();
  const dispatch = useDispatch();
  const [state, setState] = useState<PurchaseDetailPageState>({
    id: undefined,
    purchase_date: '',
    user_id: undefined,
    user_name: undefined,
    total_amount: 0,
    remarks: undefined,
    sales_tax_rate: undefined,
    details: [],
    details_amount: 0,
    fraction: 3,
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
    open: openPlaceOrderDialog,
    searchDialogProps: placeOrderSearchDialogProps,
  } = useCommonSearchDialogProps<PlaceOrder>(
    'place_order',
    async props => {
      const { id, details, remarks, fraction } = props;
      const _details = details
        .filter((x: any) => {
          return x.quantity > x.purchase_quantity;
        })
        .map((x: any) => {
          const quantity = x.quantity - x.purchase_quantity;
          const ret = calcAmount(x.unit_price, quantity, x.sales_tax_rate, x.fraction);
          return {
            ...x,
            id: null,
            place_order_detail_id: x.id,
            quantity,
            ...ret,
          } as PlaceOrderDetail;
        });
      const details_amount = _details.reduce((x, y) => {
        return x + toNumber(y.amount ?? 0);
      }, 0);
      const total_amount = calcTotalAmount(details_amount, 0, 0, 0, fraction);
      setState({
        ...state,
        details: _details,
        total_amount,
        remarks,
        fraction,
        place_order_id: id,
      });
      setErrors(undefined);
      return true;
    },
    undefined,
    'selected_for_purchase'
  );

  const backPage = () => history.push(`/${slug}`);

  const getRate: (purchase_date: string | undefined) => number = purchase_date => {
    return getSalesTaxRate(purchase_date, config);
  };

  const updateDetails: (details: PurchaseDetail[], details_amount: number) => void = (
    details,
    details_amount
  ) => {
    const total_amount = details_amount;
    setState({ ...state, details, total_amount, details_amount });
    setErrors({ ...errors, details: '' });
  };

  const { open, detailDialogProps } = usePurchaseDetailDialogProps(
    state.details,
    purchaseDetailInitialState,
    updateDetails
  );

  const get: (id: number | undefined) => Promise<boolean> = async id => {
    dispatch(AppActions.request());

    const res = await axios.get(`/api/${slug}/edit/${id ?? ''}`);

    if (res.status === 200) {
      const { purchase_date } = res.data.data;
      const sales_tax_rate = getRate(purchase_date);
      setState({ ...state, ...res.data.data, sales_tax_rate });

      dispatch(AppActions.success());
      return true;
    } else {
      // dispatch(AppActions.failed('データの取得に失敗しました。'));
      dispatch(AppActions.success());
      history.push('/404');
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
    const res = await axios.delete(`/api/purchase/delete/${id}`);

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

  const onChangeDateWidthCalc = (name: string, value: string | number | boolean | undefined) => {
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
    placeOrderSearchDialogProps,
    detailDialogProps,
    openUserDialog,
    openPlaceOrderDialog,
    onChangeDateWidthCalc,
    onChange,
    onClickAddDetail,
    onClickEditDetail,
    onClickSave,
    onClickDelete,
  };
};
