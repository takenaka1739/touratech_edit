import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { Estimate } from '@/types';
import { AppActions } from '@/app/App/modules/appModule';
import { useInitCustomer } from '@/app/App/uses/useApp';
import { useCommonDataDetailPage } from '@/app/App/uses/useCommonDataDetailPage';

type EstimateDetailPageState = Estimate & {
  details_amount: number;
  barcode: string | undefined;
};

/**
 * 見積データ（詳細）画面用 hooks
 */
export const useEstimateDetailPage = (slug: string) => {
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
    ...rest
  } = useCommonDataDetailPage<EstimateDetailPageState>(slug, {
    id: undefined,
    estimate_date: '',
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
  });

  const get: (id: number | undefined) => Promise<boolean> = async id => {
    dispatch(AppActions.request());
    const res = await axios.get(`/api/${slug}/edit/${id ?? ''}`);

    if (res.status === 200) {
      const st = toState(res.data.data);
      const sales_tax_rate = getRate(st.estimate_date);
      const has_receive_order = st.has_receive_order == 1 ? true : false;
      setState({ ...state, ...st, sales_tax_rate, has_receive_order });

      dispatch(AppActions.success());
      return true;
    } else {
      // dispatch(AppActions.failed('データの取得に失敗しました。'));
      dispatch(AppActions.success());
      history.push('/404');
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

  const onClickPrint: () => void = async () => {
    await output();
  };

  return {
    ...rest,
    id,
    state,
    onClickPrint,
  };
};
