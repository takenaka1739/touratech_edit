// resources/ts/app/Sales/uses/useSalesDetailPage.ts
// [UPDATE] アンマウント後の setState / dispatch / setIsLoading を抑止して Warning を解消
import { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { Sales } from '@/types';
import { appAlert, appConfirm } from '@/components';
import { AppActions } from '@/app/App/modules/appModule';
import { useInitCustomer } from '@/app/App/uses/useApp';
import { useCommonDataDetailPage } from '@/app/App/uses/useCommonDataDetailPage';
import { useCommonSearchDialogProps } from '@/app/App/uses/useCommonSearchDialogProps';

type SalesDetailPageState = Sales & {
  // 既存
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

  // ★追加：アンマウント判定（非同期完了後に setState しない）
  const mountedRef = useRef(true);

  const safeDispatch = useCallback(
    (action: any) => {
      if (!mountedRef.current) return;
      dispatch(action);
    },
    [dispatch],
  );

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
      // ★売上画面は「切捨て」運用に寄せる（必要ならここを 1 固定に）
      fraction: 1,
      details: [], // ← 新規は必ず空配列
      details_amount: 0,
      barcode: undefined,
      prev_title: from_receive ? '受注状況一覧' : undefined,
      prev_url: from_receive ? '/receive_order_status' : `/${slug}`,
    },
    from_receive ? '/receive_order_status' : `/${slug}`,
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
        details_amount,
        receive_order_id,
        has_sales,
        sales_tax_rate,
      } = props;

      if (has_sales == 1) {
        await appAlert('既に売上が完了しているため、選択できません。');
      } else {
        // 税率は getRate(sales_at) を優先しつつ、受注由来があるなら保険で採用
        const resolvedSalesTaxRate =
          getRate(state.sales_at) || sales_tax_rate || getRate(undefined as any) || 0;

        // ★アンマウント後に updateState しない
        if (!mountedRef.current) return true;

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
          details: Array.isArray(details) ? details : [],
          shipping_amount,
          fee,
          discount,
          total_amount,
          order_no,
          remarks,
          rate,
          // ★売上は切捨て運用に寄せる（受注の fraction を尊重したいならここを fraction に戻す）
          fraction: 1,
          sales_tax_rate: resolvedSalesTaxRate,
          details_amount: Number(details_amount ?? 0),
          receive_order_id,
        });
      }

      if (!mountedRef.current) return true;
      setErrors(undefined);
      return true;
    },
    undefined,
    'selected_for_sales',
  );

  // ===== 得意先検索ダイアログ =====
  const {
    open: openCustomerDialog,
    searchDialogProps: customerSearchDialogProps,
  } = useCommonSearchDialogProps<any>(
    'customer',
    async (c) => {
      if (!mountedRef.current) return true;

      setState((prev) => {
        const nextAddress1FromCustomer = `${c?.prefectures ?? ''}${c?.municipality ?? ''}`.trim();

        const next: SalesDetailPageState = {
          ...prev,
          customer_id: c?.id ?? prev.customer_id,
          customer_name: (c?.name as string) ?? prev.customer_name ?? '上様',
          send_flg: prev.send_flg,
          corporate_class:
            typeof c?.corporate_class === 'number' ? c.corporate_class : prev.corporate_class,
          rate: typeof c?.rate === 'number' ? c.rate : prev.rate,
          // ★売上は切捨て運用に寄せる（ここも 1 固定）
          fraction: 1,
          name: prev.name,
          zip_code: prev.zip_code,
          address1: prev.address1,
          address2: prev.address2,
          tel: prev.tel,
          fax: prev.fax,
        };

        if (c?.recipient_name) next.name = c.recipient_name;
        if (c?.zip_code) next.zip_code = c.zip_code;
        if (nextAddress1FromCustomer) next.address1 = nextAddress1FromCustomer;
        if (c?.number) next.address2 = c.number;
        if (c?.tel) next.tel = c.tel;

        return next;
      });

      if (!mountedRef.current) return true;
      setErrors(undefined);
      return true;
    },
  );

  // ===== 担当者検索ダイアログ =====
  const { open: openUserDialog, searchDialogProps: userSearchDialogProps } = useCommonSearchDialogProps<any>(
    'user',
    async (u) => {
      if (!mountedRef.current) return true;

      setState((prev) => ({
        ...prev,
        user_id: u?.id ?? prev.user_id,
        user_name: u?.name ?? prev.user_name,
      }));

      if (!mountedRef.current) return true;
      setErrors(undefined);
      return true;
    },
  );

  /**
   * ★新規作成（idなし）でも「新規初期値」を API から取得して state に反映する
   * - このプロジェクトの routes は GET /api/sales/edit/ が「新規（IDなし）」のエンドポイント
   * - sales_tax_rate をここで必ず入れる（モーダルの税計算が 0 にならないように）
   */
  const getNewData: () => Promise<boolean> = async () => {
    safeDispatch(AppActions.request());
    try {
      // ★重要：routes.php では new は存在せず、新規は edit/（IDなし）
      const res = await axios.get(`/api/${slug}/edit/`);

      if (res.status === 200) {
        const st = toState(res.data?.data ?? { details: [] });

        st.details = Array.isArray(st.details) ? st.details : [];

        // ★税率は「日付基準」を優先（旧仕様）
        // sales_at が未設定なら edit/ の返却値に依存するので、st 側を参照
        const baseDate = st.sales_at || (st as any).sales_date || state.sales_at;
        const resolvedSalesTaxRate = getRate(baseDate) || (st as any).sales_tax_rate || 0;

        if (!mountedRef.current) return true;

        setState((prev) => ({
          ...prev,
          ...st,
          sales_tax_rate: resolvedSalesTaxRate,
          // ★売上は切捨て固定（UI要件）
          fraction: 1,
        }));

        if (!mountedRef.current) return true;
        setErrors(undefined);
        safeDispatch(AppActions.success());
        return true;
      }

      safeDispatch(AppActions.success());
      return false;
    } catch {
      safeDispatch(AppActions.failed('新規データの取得に失敗しました。'));
      return false;
    }
  };

  // 新規(id 未指定)のときも getNewData() で初期値を取りに行く
  const get: (id: number | undefined) => Promise<boolean> = async (idArg) => {
    // 新規（通常遷移）: edit/（IDなし）で初期値を取得
    if (!from_receive && (idArg === undefined || idArg === null)) {
      return await getNewData();
    }

    safeDispatch(AppActions.request());

    let url = '';
    let receive_order_id = undefined as number | undefined;
    if (from_receive) {
      url = `/api/${slug}/edit_by_receive_id/${idArg}`;
      receive_order_id = idArg as number | undefined;
    } else {
      if (idArg === undefined || idArg === null) {
        safeDispatch(AppActions.success());
        return true;
      }
      url = `/api/${slug}/edit/${idArg}`;
    }

    try {
      const res = await axios.get(url);
      if (res.status === 200) {
        const st = toState(res.data?.data ?? { details: [] });

        st.details = Array.isArray(st.details) ? st.details : [];

        // 税率・請求済フラグ
        const sales_tax_rate = getRate(st.sales_at) || (st as any).sales_tax_rate || 0;
        const has_invoice = st.has_invoice == 1;

        const delivery = res.data?.data?.delivery;
        if (delivery) {
          st.name = delivery?.recipient_name ?? st.name ?? '';
          st.zip_code = delivery?.zip_code ?? st.zip_code ?? '';
          st.address1 =
            `${delivery?.prefectures ?? ''}${delivery?.municipality ?? ''}` || st.address1 || '';
          st.address2 = delivery?.number ?? st.address2 ?? '';
          st.tel = delivery?.tel ?? st.tel ?? '';
        }

        if (!mountedRef.current) return true;

        setState((prev) => ({
          ...prev,
          ...st,
          sales_tax_rate,
          // ★売上は切捨て固定（UI要件）
          fraction: 1,
          has_invoice,
          ...(from_receive ? { receive_order_id } : {}),
        }));

        if (!mountedRef.current) return true;
        setErrors(undefined);
        safeDispatch(AppActions.success());
        return true;
      } else {
        safeDispatch(AppActions.success());
        history.push('/404');
      }
    } catch {
      safeDispatch(AppActions.failed('データの取得に失敗しました。'));
    }

    return false;
  };

  const validate: () => Promise<boolean> = async () => {
    safeDispatch(AppActions.request());
    try {
      const res = await axios.post(`/api/${slug}/validate_edit/${id}`, state);
      if (res.status === 200) {
        safeDispatch(AppActions.success());
        if (res.data.success) {
          if (!mountedRef.current) return false;
          setErrors(undefined);
          if (res.data.data?.check === 'NG') {
            return await appConfirm('支払方法がマスタに登録されているものと異なりますがよろしいですか？');
          }
          return true;
        } else {
          if (!mountedRef.current) return false;
          setErrors(res.data.errors);
        }
      } else {
        safeDispatch(AppActions.failed('取込に失敗しました。'));
      }
    } catch {
      safeDispatch(AppActions.failed('検証に失敗しました。'));
    }
    return false;
  };

  const edit: (id: number) => Promise<boolean> = async (idArg) => {
    safeDispatch(AppActions.request());
    try {
      const res = await axios.put(`/api/${slug}/edit/${idArg}`, state);
      if (res.status === 200) {
        safeDispatch(AppActions.success());
        if (res.data.success) {
          if (!mountedRef.current) return false;
          setErrors(undefined);
          return true;
        } else {
          if (!mountedRef.current) return false;
          setErrors(res.data.errors);
        }
      } else {
        safeDispatch(AppActions.failed('データの保存に失敗しました。'));
      }
    } catch {
      safeDispatch(AppActions.failed('データの保存に失敗しました。'));
    }
    return false;
  };

  const output: (doc_type: string) => Promise<boolean> = async (doc_type) => {
    safeDispatch(AppActions.request());
    try {
      const res = await axios.post(`/api/${slug}/output/${doc_type}`, state);
      if (res.status === 200) {
        safeDispatch(AppActions.success());
        if (res.data.success) {
          if (!mountedRef.current) return false;
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
          if (!mountedRef.current) return false;
          setErrors(res.data.errors);
        }
      } else {
        safeDispatch(AppActions.failed('印刷に失敗しました。'));
      }
    } catch {
      safeDispatch(AppActions.failed('印刷に失敗しました。'));
    }
    return false;
  };

  // ★修正：アンマウント後に setIsLoading(false) しない（Warning対策）
  useEffect(() => {
    mountedRef.current = true;

    get(id).then(() => {
      if (!mountedRef.current) return;
      setIsLoading(false);
    });

    return () => {
      mountedRef.current = false;
    };
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
