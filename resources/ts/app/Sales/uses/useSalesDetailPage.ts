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
      sales_at: '',
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
      details: [],                 // ← 新規は必ず空配列
      details_amount: 0,
      barcode: undefined,
      prev_title: from_receive ? '受注状況一覧' : undefined,
      prev_url: from_receive ? '/receive_order_status' : `/${slug}`,
    },
    from_receive ? '/receive_order_status' : `/${slug}`
  );

  // ===== 受注検索ダイアログ =====
  const {
    open: openReceiveOrderDialog,
    searchDialogProps: receiveOrderSearchDialogProps,
  } = useCommonSearchDialogProps<any>(
    'receive_order',
    async (props) => {
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
          send_flg, // 受注からの取り込み時は明示的に反映
          name,
          zip_code,
          address1,
          address2,
          tel,
          fax,
          corporate_class,
          details: Array.isArray(details) ? details : [], // 念のため安全化
          shipping_amount,
          fee,
          discount,
          total_amount,
          order_no,
          remarks,
          rate,
          fraction,
          details_amount: Number(details_amount ?? 0),
          receive_order_id,
        });
      }
      setErrors(undefined);
      return true;
    },
    undefined,
    'selected_for_sales'
  );

  // ===== 得意先検索ダイアログ =====
  // 要件：得意先選択時に send_flg を勝手に変えない。
  // corporate_class / rate / fraction は値が入っている場合のみ上書き。未定義は維持。
  // 届け先（name/zip/address/tel）は、得意先側に値がある場合のみ上書き。無ければ現状維持（リセットしない）。
  const {
    open: openCustomerDialog,
    searchDialogProps: customerSearchDialogProps,
  } = useCommonSearchDialogProps<any>(
    'customer',
    async (c) => {
      setState((prev) => {
        // 得意先の住所構成（pref + muni は address1 同等）
        const nextAddress1FromCustomer =
          `${c?.prefectures ?? ''}${c?.municipality ?? ''}`.trim();

        const next: SalesDetailPageState = {
          ...prev,
          customer_id: c?.id ?? prev.customer_id,
          customer_name: (c?.name as string) ?? prev.customer_name ?? '上様',
          // send_flg は UI 操作に委ね、ここでは変更しない
          send_flg: prev.send_flg,
          // corporate_class / rate / fraction は値がある時のみ上書き
          corporate_class:
            (typeof c?.corporate_class === 'number' ? c.corporate_class : prev.corporate_class),
          rate:
            (typeof c?.rate === 'number' ? c.rate : prev.rate),
          fraction:
            (typeof c?.fraction === 'number' ? c.fraction : prev.fraction),
          // そのまま保持する既存値
          name: prev.name,
          zip_code: prev.zip_code,
          address1: prev.address1,
          address2: prev.address2,
          tel: prev.tel,
          fax: prev.fax,
        };

        // 届け先：得意先側に値があれば“その項目だけ”上書き、無ければ維持
        if (c?.recipient_name) next.name = c.recipient_name;
        if (c?.zip_code) next.zip_code = c.zip_code;
        if (nextAddress1FromCustomer) next.address1 = nextAddress1FromCustomer;
        if (c?.number) next.address2 = c.number;
        if (c?.tel) next.tel = c.tel;

        return next;
      });
      setErrors(undefined);
      return true;
    }
  );

  // ===== 担当者検索ダイアログ =====
  // 担当者は任意。選択時のみ user_id / user_name を更新。
  const {
    open: openUserDialog,
    searchDialogProps: userSearchDialogProps,
  } = useCommonSearchDialogProps<any>(
    'user',
    async (u) => {
      setState((prev) => ({
        ...prev,
        user_id: u?.id ?? prev.user_id,
        user_name: u?.name ?? prev.user_name,
      }));
      setErrors(undefined);
      return true;
    }
  );

  // ★ 新規(id 未指定)のときは API を呼ばない（/api/sales/edit/ を叩かない）
  const get: (id: number | undefined) => Promise<boolean> = async (idArg) => {
    if (!from_receive && (idArg === undefined || idArg === null)) {
      dispatch(AppActions.success());
      return true;
    }

    dispatch(AppActions.request());

    let url = '';
    let receive_order_id = undefined as number | undefined;
    if (from_receive) {
      url = `/api/${slug}/edit_by_receive_id/${idArg}`;
      receive_order_id = idArg as number | undefined;
    } else {
      if (idArg === undefined || idArg === null) {
        dispatch(AppActions.success());
        return true;
      }
      url = `/api/${slug}/edit/${idArg}`;
    }

    try {
      const res = await axios.get(url);
      if (res.status === 200) {
        const st = toState(res.data?.data ?? { details: [] });

        // 安全な明細配列に補正
        st.details = Array.isArray(st.details) ? st.details : [];

        // 税率・請求済フラグ
        const sales_tax_rate = getRate(st.sales_at);
        const has_invoice = st.has_invoice == 1;

        // 配送先（存在すれば反映）
        const delivery = res.data?.data?.delivery;
        if (delivery) {
          st.name = delivery?.recipient_name ?? st.name ?? '';
          st.zip_code = delivery?.zip_code ?? st.zip_code ?? '';
          st.address1 = `${delivery?.prefectures ?? ''}${delivery?.municipality ?? ''}` || st.address1 || '';
          st.address2 = delivery?.number ?? st.address2 ?? '';
          st.tel = delivery?.tel ?? st.tel ?? '';
        }

        // ★ setStateは“関数形式”で。古いstateを潰さない
        setState((prev) => ({
          ...prev,
          ...st,
          sales_tax_rate,
          has_invoice,
          ...(from_receive ? { receive_order_id } : {}),
        }));

        setErrors(undefined);
        dispatch(AppActions.success());
        return true;
      } else {
        dispatch(AppActions.success());
        history.push('/404');
      }
    } catch (e) {
      dispatch(AppActions.failed('データの取得に失敗しました。'));
    }

    return false;
  };

  const validate: () => Promise<boolean> = async () => {
    dispatch(AppActions.request());
    try {
      const res = await axios.post(`/api/${slug}/validate_edit/${id}`, state);
      if (res.status === 200) {
        dispatch(AppActions.success());
        if (res.data.success) {
          setErrors(undefined);
          if (res.data.data?.check === 'NG') {
            return (await appConfirm('支払方法がマスタに登録されているものと異なりますがよろしいですか？'));
          }
          return true;
        } else {
          setErrors(res.data.errors);
        }
      } else {
        dispatch(AppActions.failed('取込に失敗しました。'));
      }
    } catch {
      dispatch(AppActions.failed('検証に失敗しました。'));
    }
    return false;
  };

  const edit: (id: number) => Promise<boolean> = async (idArg) => {
    dispatch(AppActions.request());
    try {
      const res = await axios.put(`/api/${slug}/edit/${idArg}`, state);
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
    } catch {
      dispatch(AppActions.failed('データの保存に失敗しました。'));
    }
    return false;
  };

  const output: (doc_type: string) => Promise<boolean> = async (doc_type) => {
    dispatch(AppActions.request());
    try {
      const res = await axios.post(`/api/${slug}/output/${doc_type}`, state);
      if (res.status === 200) {
        dispatch(AppActions.success());
        if (res.data.success) {
          setErrors(undefined);
          const { file_id } = res.data.data ?? {};
          if (file_id) {
            const link = document.createElement('a');
            link.href = `/web/${slug}/output/${doc_type}/${file_id}`;
            link.target = '_blank';
            link.click();
            return true;
          }
        } else {
          setErrors(res.data.errors);
        }
      } else {
        dispatch(AppActions.failed('印刷に失敗しました。'));
      }
    } catch {
      dispatch(AppActions.failed('印刷に失敗しました。'));
    }
    return false;
  };

  useEffect(() => {
    // ★ 新規はロードだけ解除（APIは叩かない）
    if (!from_receive && (id === undefined || id === null)) {
      setIsLoading(false);
      return;
    }
    get(id).then((ret) => {
      if (ret) setIsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, from_receive]);

  const onClickSave: () => void = async () => {
    // 既存更新
    if (id && !from_receive) {
      if (await validate()) {
        if (await edit(id)) {
          await appAlert('保存しました。');
          backPage();
        } else {
          window.scrollTo(0, 0);
        }
      }
      return;
    }

    // 新規作成
    const newId = await store();
    if (newId && Number(newId) > 0) {
      await appAlert('保存しました。');
      backPage();
    } else {
      window.scrollTo(0, 0);
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
        const newId = await store();
        if (newId > 0) {
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
    if (await appConfirm('請求書データを登録しますか？')) {
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
        const newId = await store();
        if (newId > 0) {
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
    // ダイアログ一式を返す
    receiveOrderSearchDialogProps,
    openReceiveOrderDialog,
    customerSearchDialogProps,
    openCustomerDialog,
    userSearchDialogProps,
    openUserDialog,
    onClickSave,
    onClickPrintDelivery,
    onClickPrintInvoice,
  };
};
