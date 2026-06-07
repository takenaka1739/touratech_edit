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
  // ▼ Square連携用（追加）
  square_payment_id?: string | null;
  square_status?: 'authorized' | 'captured' | 'canceled' | 'voided' | 'failed' | null;
  square_payment_flow?: 'delayed_capture' | 'card_on_file' | string | null;
  square_payment_status?: 'pending' | 'charged' | 'failed' | 'canceled' | string | null;
  square_payment_error?: string | null;
  customer_payment_id?: number | null;
  square_card?: {
    id: number;
    brand?: string | null;
    last4?: string | null;
    expiry?: string | null;
    account_name?: string | null;
  } | null;
  square_payment_attempts?: {
    id: number;
    square_payment_id?: string | null;
    square_status?: string | null;
    amount?: number | null;
    currency?: string | null;
    error_code?: string | null;
    error_message?: string | null;
    attempted_at?: string | null;
  }[];

  // 既存
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
    additional_shipping_amount: undefined,
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

    // ▼ Square 連携（初期は未連携）
    square_payment_id: undefined,
    square_status: undefined,
    square_payment_flow: undefined,
    square_payment_status: undefined,
    square_payment_error: undefined,
    customer_payment_id: undefined,
    square_card: undefined,
    square_payment_attempts: [],
  });

  /**
   * 見積取得 → 受注明細に詰め替え
   * - discount を必ず引き継ぐ（無ければ 0）
   * - 計算系が number 前提のため、ここで number 化しておく（文字列混入対策）
   */
  const normalizeDetailFromEstimate = (x: any) => {
    return {
      ...x,
      // 受注側では新規明細として扱う
      id: null,
      estimate_detail_id: x.id,

      // ▼ 明細割引（追加）
      discount: x.discount != null && x.discount !== '' ? Number(x.discount) : 0,

      // ▼ 数値項目は number 化（混在対策）
      amount: x.amount != null && x.amount !== '' ? Number(x.amount) : 0,
      sales_tax: x.sales_tax != null && x.sales_tax !== '' ? Number(x.sales_tax) : 0,
      sales_tax_rate: x.sales_tax_rate != null && x.sales_tax_rate !== '' ? Number(x.sales_tax_rate) : undefined,
      unit_price: x.unit_price != null && x.unit_price !== '' ? Number(x.unit_price) : undefined,
      quantity: x.quantity != null && x.quantity !== '' ? Number(x.quantity) : undefined,
      rate: x.rate != null && x.rate !== '' ? Number(x.rate) : x.rate,
      sales_unit_price:
        x.sales_unit_price != null && x.sales_unit_price !== '' ? Number(x.sales_unit_price) : x.sales_unit_price,
    };
  };

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
      additional_shipping_amount,
      fee,
      discount,
      total_amount,
      order_no,
      remarks,
      rate,
      fraction,
    } = props;

    const _details = (details ?? []).map((x: any) => normalizeDetailFromEstimate(x));

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
      additional_shipping_amount,
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

      // st の中に square_payment_id / square_status も含まれていれば
      // ここで一緒に state にマージされる
      setState({
        ...state,
        ...st,
        sales_tax_rate,
        has_sales,
      });

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

 const save: () => Promise<ReceiveOrderDetailPageState | undefined> = async () => {
  dispatch(AppActions.request());

  const requestState = { ...state };
  const url = id ? `/api/${slug}/edit/${id}` : `/api/${slug}/store`;

  try {
    const res = id ? await axios.put(url, requestState) : await axios.post(url, requestState);

    if (res.status === 200) {
      dispatch(AppActions.success());

      if (res.data.success) {
        setErrors(undefined);

        const savedState = toState(res.data.data) as ReceiveOrderDetailPageState;

        console.log('[ReceiveOrder][save] savedState', {
          savedState,
          savedDetails: savedState?.details,
        });

        const sales_tax_rate = getRate(savedState.receive_order_date ?? requestState.receive_order_date);

        const mergedState = {
          ...requestState,
          ...savedState,
          details: requestState.details,
          sales_tax_rate,
        };

        console.log('[ReceiveOrder][save] mergedState', {
          mergedState,
          mergedDetails: mergedState.details,
        });

        setState(mergedState);

        return mergedState;
      }

      console.log('[ReceiveOrder][save] validation failed', {
        errors: res.data.errors,
        data: res.data,
      });

      setErrors(res.data.errors);
    } else {
      console.log('[ReceiveOrder][save] non-200 response', {
        status: res.status,
        data: res.data,
      });

      dispatch(AppActions.failed('保存に失敗しました。'));
    }
  } catch (error: any) {
    console.error('[ReceiveOrder][save] catch error', {
      message: error?.message,
      status: error?.response?.status,
      responseData: error?.response?.data,
      requestState,
    });

    dispatch(AppActions.failed('保存に失敗しました。'));
  }

  window.scrollTo(0, 0);
  return undefined;
};

  const output: (targetState: ReceiveOrderDetailPageState) => Promise<boolean> = async targetState => {
    dispatch(AppActions.request());

    const res = await axios.post(`/api/${slug}/output`, targetState);
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

  const onClickSave: () => void = async () => {
    const savedState = await save();

    if (savedState) {
      rest.backPage();
    }
  };

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
    const targetState = id && (state.has_sales ?? 0) !== 0 ? { ...state, id } : await save();

    if (!targetState) {
      return;
    }

    if (await output(targetState)) {
      rest.backPage();
    } else {
      window.scrollTo(0, 0);
    }
  };

  return {
    ...rest,
    id,
    state,
    estimateSearchDialogProps,
    openEstimateDialog,
    onClickSave,
    onClickDelete,
    onClickPrint,
  };
};
