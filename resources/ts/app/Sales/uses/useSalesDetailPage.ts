import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { Sales } from '@/types';
import { appAlert, appConfirm } from '@/components';
import { AppActions } from '@/app/App/modules/appModule';
import { useInitCustomer } from '@/app/App/uses/useApp';
import { useCommonDataDetailPage } from '@/app/App/uses/useCommonDataDetailPage';
import { useCommonSearchDialogProps } from '@/app/App/uses/useCommonSearchDialogProps';

type SalesDetailPageState = Sales & {
  details_amount: number;
  barcode: string | undefined;
  prev_title: string | undefined;
  prev_url: string;
};

/**
 * 売上データ（詳細）画面用 hooks
 */
export const useSalesDetailPage = (slug: string, from_receive: boolean) => {
  const dispatch = useDispatch();
  const initCustomer = useInitCustomer();
  const {
    id,
    state,
    history,
    setIsLoading,
    setState,
    setErrors,
    updateState,
    toState,
    getRate,
    backPage,
    store,
    // edit,
    ...rest
  } = useCommonDataDetailPage<SalesDetailPageState>(
    slug,
    {
      id: undefined,
      sales_date: '',
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
      prev_title: from_receive ? '受注状況一覧' : undefined,
      prev_url: from_receive ? '/receive_order_status' : `/${slug}`,
    },
    from_receive ? '/receive_order_status' : `/${slug}`
  );

  const {
    open: openReceiveOrderDialog,
    searchDialogProps: receiveOrderSearchDialogProps,
  } = useCommonSearchDialogProps<any>(
    'receive_order',
    async props => {
      const {
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
        details_amount,
        receive_order_id,
        has_sales,
      } = props;
      if (has_sales == 1) {
        await appAlert('既に売上が完了しているため、選択できません。');
      } else {
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
          details,
          shipping_amount,
          fee,
          discount,
          total_amount,
          order_no,
          remarks,
          rate,
          fraction,
          details_amount,
          receive_order_id,
        });
      }
      setErrors(undefined);
      return true;
    },
    undefined,
    'selected_for_sales'
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
      const st = toState(res.data.data);
      const sales_tax_rate = getRate(st.sales_date);
      const has_invoice = st.has_invoice == 1 ? true : false;
      if (from_receive) {
        setState({ ...state, ...st, sales_tax_rate, has_invoice, receive_order_id });
      } else {
        setState({ ...state, ...st, sales_tax_rate, has_invoice });
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

  const validate: () => Promise<boolean> = async () => {
    dispatch(AppActions.request());

    const res = await axios.post(`/api/${slug}/validate_edit/${id}`, state);
    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        setErrors(undefined);
        if (res.data.data?.check === 'NG') {
          if (
            await appConfirm('支払方法がマスタに登録されているものと異なりますがよろしいですか？')
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
      dispatch(AppActions.failed('取込に失敗しました。'));
    }
    return false;
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

  const output: (doc_type: string) => Promise<boolean> = async (doc_type) => {
    dispatch(AppActions.request());

    const res = await axios.post(`/api/${slug}/output/${doc_type}`, state);
    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        setErrors(undefined);

        const { file_id } = res.data.data;
        const link = document.createElement('a');
        link.href = `/web/${slug}/output/${doc_type}/${file_id}`;
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
    if (id && !from_receive) {
      if (await validate()) {
        if (await edit(id)) {
          await appAlert('保存しました。');
          backPage();
        } else {
          window.scrollTo(0, 0);
        }
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

  const onClickPrintDelivery: () => void = async () => {
    if (await appConfirm('納品書データを登録しますか？')) {
      if (id && !from_receive) {
        if (await validate()) {
          if (await edit(id)) {
            await output('delivery');
            backPage();
          } else {
            window.scrollTo(0, 0);
          }
        }
      } else {
        const id = await store();
        if (id > 0) {
          await output('delivery');
          backPage();
        } else {
          window.scrollTo(0, 0);
        }
      }
    } else {
      await output('delivery');
    }
  };

  const onClickPrintInvoice: () => void = async () => {
    if (await appConfirm('納品書データを登録しますか？')) {
      if (id && !from_receive) {
        if (await validate()) {
          if (await edit(id)) {
            await output('invoice');
            backPage();
          } else {
            window.scrollTo(0, 0);
          }
        }
      } else {
        const id = await store();
        if (id > 0) {
          await output('invoice');
          backPage();
        } else {
          window.scrollTo(0, 0);
        }
      }
    } else {
      await output('invoice');
    }
  };

  return {
    ...rest,
    id,
    state,
    receiveOrderSearchDialogProps,
    openReceiveOrderDialog,
    onClickSave,
    onClickPrintDelivery,
    onClickPrintInvoice,
  };
};
