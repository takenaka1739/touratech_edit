import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { Estimate, ReceiveOrder } from '@/types';
import { appAlert, appConfirm } from '@/components';
import { AppActions } from '@/app/App/modules/appModule';
import { useInitCustomer } from '@/app/App/uses/useApp';
import { useCommonDataDetailPage } from '@/app/App/uses/useCommonDataDetailPage';
import { useCommonSearchDialogProps } from '@/app/App/uses/useCommonSearchDialogProps';

type ReceiveOrderDetailPageState = ReceiveOrder & {
  details_amount: number;
  barcode: string | undefined;
};

/**
 * 受注詳細画面用 hooks
 */
export const useReceiveOrderDetailPage = (slug: string) => {
  const dispatch = useDispatch();
  const initCustomer = useInitCustomer();
  const {
    id,
    state,
    history,
    setIsLoading,
    setState,
    setErrors,
    toState,
    getRate,
    updateState,
    ...rest
  } = useCommonDataDetailPage<ReceiveOrderDetailPageState>(slug, {
    id: undefined,
    receive_order_date: '',
    delivery_date: '',
    customer_id: undefined,
    customer_name: initCustomer?.name,
    send_flg: false,
    name: '',
    zip_code: '',
    address1: '',
    address2: '',
    tel: '',
    fax: '',
    corporate_class: initCustomer?.corporate_class ?? 1,
    user_id: undefined,
    user_name: undefined,
    shipping_amount: undefined,
    fee: undefined,
    discount: undefined,
    total_amount: 0,
    order_no: undefined,
    remarks: undefined,
    rate: 100,
    sales_tax_rate: undefined,
    fraction: initCustomer?.fraction ?? 1,
    details: [],
    details_amount: 0,
    barcode: undefined,
    estimate_id: undefined,
  });

  const {
    open: openEstimateDialog,
    searchDialogProps: estimateSearchDialogProps,
  } = useCommonSearchDialogProps<Estimate>('estimate', async props => {
    const {
      id,
      delivery_date,
      customer_id,
      customer_name,
      send_flg,
      name,
      zip_code,
      address1,
      address2,
      tel,
      fax,
      corporate_class,
      details,
      shipping_amount,
      fee,
      discount,
      total_amount,
      order_no,
      remarks,
      rate,
      fraction,
    } = props;
    const _details = details.map(function(x: any) {
      return { ...x, id: null, estimate_detail_id: x.id };
    });
    updateState({
      delivery_date,
      customer_id,
      customer_name: customer_name ?? '上様',
      send_flg,
      name,
      zip_code,
      address1,
      address2,
      tel,
      fax,
      corporate_class,
      details: _details,
      shipping_amount,
      fee,
      discount,
      total_amount,
      order_no,
      remarks,
      rate,
      fraction,
      estimate_id: id,
    });
    setErrors(undefined);
    return true;
  });

  const get: (id: number | undefined) => Promise<boolean> = async id => {
    dispatch(AppActions.request());
    const res = await axios.get(`/api/${slug}/edit/${id ?? ''}`);

    if (res.status === 200) {
      const st = toState(res.data.data);
      const sales_tax_rate = getRate(st.receive_order_date);
      const has_sales = st.has_sales ?? 0;
      setState({ ...state, ...st, sales_tax_rate, has_sales });

      dispatch(AppActions.success());
      return true;
    } else {
      // dispatch(AppActions.failed('データの取得に失敗しました。'));
      dispatch(AppActions.success());
      history.push('/404');
    }
    return false;
  };

  const validate: () => Promise<boolean> = async () => {
    dispatch(AppActions.request());

    const res = await axios.post(`/api/${slug}/validate_delete/${id}`, state);
    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        setErrors(undefined);
        if (res.data.data?.check === 'NG') {
          if (
            await appConfirm(
              'この受注に関連する発注データが存在しますが、本当に削除しますか？\n※発注データは削除されずにそのまま残ります。'
            )
          ) {
            return true;
          } else {
            return false;
          }
        }
        return true;
      } else {
        setErrors(res.data.errors);
      }
    } else {
      dispatch(AppActions.failed('削除に失敗しました。'));
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

  const output: () => Promise<boolean> = async () => {
    dispatch(AppActions.request());

    const res = await axios.post(`/api/${slug}/output`, state);
    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        setErrors(undefined);

        const { file_id } = res.data.data;
        const link = document.createElement('a');
        link.href = `/web/${slug}/output/${file_id}`;
        link.target = '_blank';
        link.click();

        return true;
      } else {
        setErrors(res.data.errors);
      }
    } else {
      dispatch(AppActions.failed('印刷に失敗しました。'));
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

  const onClickDelete: () => void = async () => {
    if (!id) {
      return;
    }
    if (await appConfirm('削除します。よろしいですか？')) {
      if (await validate()) {
        if (await destroy(id)) {
          await appAlert('削除しました。');
          rest.backPage();
        } else {
          window.scrollTo(0, 0);
        }
      }
    }
  };

  const onClickPrint: () => void = async () => {
    await output();
  };

  return {
    ...rest,
    id,
    state,
    estimateSearchDialogProps,
    openEstimateDialog,
    onClickDelete,
    onClickPrint,
  };
};
