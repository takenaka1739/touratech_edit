// 更新: resources/ts/app/Sales/uses/useSalesDetailPage.ts
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
  details_amount: number;
  barcode: string | undefined;
  prev_title: string | undefined;
  prev_url: string;
  is_send?: number;

  // 受注のSquare状態（売上画面で決済/キャンセル制御に使う）
  square_payment_id?: string | number | null;
  square_status?: string | null;
};

const to01 = (v: any): 0 | 1 => (Number(v) === 1 || v === true ? 1 : 0);
const toBool = (v: any): boolean => to01(v) === 1;

const normalizeDetailFromReceiveOrder = (x: any) => {
  const receiveOrderDetailId =
    x?.receive_order_detail_id != null && x.receive_order_detail_id !== ''
      ? Number(x.receive_order_detail_id)
      : x?.id != null && x.id !== ''
      ? Number(x.id)
      : undefined;

  return {
    ...x,
    id: null,
    receive_order_detail_id: receiveOrderDetailId,
    discount: x?.discount != null && x.discount !== '' ? Number(x.discount) : 0,
    amount: x?.amount != null && x.amount !== '' ? Number(x.amount) : 0,
    sales_tax: x?.sales_tax != null && x.sales_tax !== '' ? Number(x.sales_tax) : 0,
    sales_tax_rate:
      x?.sales_tax_rate != null && x.sales_tax_rate !== '' ? Number(x.sales_tax_rate) : undefined,
    unit_price: x?.unit_price != null && x.unit_price !== '' ? Number(x.unit_price) : undefined,
    quantity: x?.quantity != null && x.quantity !== '' ? Number(x.quantity) : undefined,
    rate: x?.rate != null && x.rate !== '' ? Number(x.rate) : x?.rate,
    sales_unit_price:
      x?.sales_unit_price != null && x.sales_unit_price !== ''
        ? Number(x.sales_unit_price)
        : x?.sales_unit_price,
  };
};

// 空文字も null 扱いしたい用途向け
const normStr = (v: any): string => (v === null || v === undefined ? '' : String(v).trim());

/**
 * 売上データ（詳細）画面用 hooks
 */
export const useSalesDetailPage = (slug: string, from_receive: boolean) => {
  const dispatch = useDispatch();
  const initCustomer = useInitCustomer();

  // アンマウント判定
  const mountedRef = useRef(true);

  /**
   * ★重要: 受注由来明細の receive_order_detail_id を「落としても復元できる」ように保持する
   *
   * 背景:
   * - 受注取り込み直後の details には receive_order_detail_id があるはず
   * - しかしその後の明細編集（数量変更/追加/差し替え）で key が欠落しがち
   * - 保存時に receive_order_detail_id が無いと、
   *   t_link_r_order_sales_detail が作れず has_sales が 0 のままになる
   *
   * 方針:
   * - 受注取り込み時点で Map に保存
   * - 保存直前(buildPayload)で復元して送る
   *
   * キー設計:
   * - 受注由来の明細は receive_order_detail_id が一意なので本来不要だが、
   *   失われた時に復元するために「同一明細を同定するキー」を作る
   * - no + item_id + item_kind を基本にする（十分安定）
   */
  const receiveDetailIdMapRef = useRef<Map<string, number>>(new Map());

  const buildDetailKey = useCallback((d: any): string => {
    const no = Number(d?.no ?? 0);
    const itemId = Number(d?.item_id ?? 0);
    const kind = Number(d?.item_kind ?? 0);
    return `${no}:${kind}:${itemId}`;
  }, []);

  const rememberReceiveDetailIds = useCallback(
    (details: any[]) => {
      if (!Array.isArray(details)) return;
      for (const d of details) {
        const rid = Number(d?.receive_order_detail_id ?? 0);
        if (rid > 0) {
          const key = buildDetailKey(d);
          receiveDetailIdMapRef.current.set(key, rid);
        }
      }
    },
    [buildDetailKey],
  );

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
    store: commonStore,
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
      is_send: 0,
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
      fraction: 1,
      details: [],
      details_amount: 0,
      barcode: undefined,
      prev_title: from_receive ? '受注状況一覧' : undefined,
      prev_url: from_receive ? '/receive_order_status' : `/${slug}`,

      square_payment_id: undefined,
      square_status: undefined,
    },
    from_receive ? '/receive_order_status' : `/${slug}`,
  );

  /**
   * 422(Laravel validation) を拾って errors を state に流す
   * - true: 422 を処理した（failed を出さない）
   * - false: 422 ではない
   */
  const handleValidationError = useCallback(
    (e: unknown): boolean => {
      const err = e as any;
      const status = err?.response?.status;
      if (status !== 422) return false;

      const errs = err?.response?.data?.errors;
      if (!mountedRef.current) return true;

      setErrors(errs ?? undefined);
      safeDispatch(AppActions.success());
      return true;
    },
    [safeDispatch, setErrors],
  );

  /**
   * Sales API の「200 + success:false + errors」を拾う
   * - true: errors を処理した
   * - false: その形式ではない
   */
  const handleApiErrors200 = useCallback(
    (res: any): boolean => {
      if (!res || res.status !== 200) return false;
      if (res.data?.success !== false) return false;

      if (!mountedRef.current) return true;
      setErrors(res.data?.errors ?? undefined);
      return true;
    },
    [setErrors],
  );

  const buildPayload = useCallback(() => {
    const isSend01 = to01((state as any)?.is_send ?? (state as any)?.send_flg ?? 0);

    // ★保存直前に receive_order_detail_id を復元する
    const rawDetails = Array.isArray((state as any)?.details) ? (state as any).details : [];
    const patchedDetails = rawDetails.map((d: any) => {
      const rid = Number(d?.receive_order_detail_id ?? 0);
      if (rid > 0) return d;

      const key = buildDetailKey(d);
      const remembered = receiveDetailIdMapRef.current.get(key);
      if (remembered && remembered > 0) {
        return { ...d, receive_order_detail_id: remembered };
      }
      return d;
    });

    return {
      ...state,
      details: patchedDetails,
      is_send: isSend01,
      // API互換（0/1として送る）
      send_flg: isSend01,
    } as any;
  }, [state, buildDetailKey]);

  const create: () => Promise<number> = useCallback(async () => {
  safeDispatch(AppActions.request());
  try {
    const payload = buildPayload();

    const res = await axios.post(`/api/${slug}/store`, payload);

    if (handleApiErrors200(res)) {
      safeDispatch(AppActions.success());
      return 0;
    }

    safeDispatch(AppActions.success());

    if (res.status === 200 && res.data?.success) {
      const newId =
        Number(res.data?.data?.id) ||
        Number(res.data?.data) ||
        Number(res.data?.id) ||
        0;

      if (!mountedRef.current) return 0;
      setErrors(undefined);
      return newId;
    }

    if (!mountedRef.current) return 0;
    setErrors(res.data?.errors);
    return 0;
  } catch (e) {
    if (handleValidationError(e)) return -1;

    safeDispatch(AppActions.failed('データの保存に失敗しました。'));
    return 0;
  }
}, [slug, buildPayload, safeDispatch, setErrors, handleValidationError, handleApiErrors200]);

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
      additional_shipping_amount,
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

      square_payment_id,
      square_status,
    } = props;

    if (has_sales == 1) {
      await appAlert('既に売上が完了しているため、選択できません。');
    } else {
      const resolvedSalesTaxRate =
        getRate(state.sales_at) || sales_tax_rate || getRate(undefined as any) || 0;

      if (!mountedRef.current) return true;

      const isSend01 = to01(send_flg);
      const isSendBool = toBool(send_flg);

      const nextDetails = Array.isArray(details)
        ? details.map((x: any) => normalizeDetailFromReceiveOrder(x))
        : [];

      // ★受注選択時点で receive_order_detail_id を記憶
      rememberReceiveDetailIds(nextDetails);

      updateState({
        delivery_date,
        customer_id,
        customer_name: customer_name ?? '上様',

        send_flg: isSendBool,
        is_send: isSend01,

        name,
        zip_code,
        address1,
        address2,
        tel,
        fax,
        corporate_class,
        details: nextDetails,
        shipping_amount,
        additional_shipping_amount,
        fee,
        discount,
        total_amount,
        order_no,
        remarks,
        rate,
        fraction: 1,
        sales_tax_rate: resolvedSalesTaxRate,
        details_amount: Number(details_amount ?? 0),
        receive_order_id,

        square_payment_id,
        square_status,
      });
    }

    if (!mountedRef.current) return true;
    setErrors(undefined);
    return true;
  },
  undefined,
  'selected_for_sales',
);

const openReceiveOrderDialogWithLog = useCallback(() => {
  return openReceiveOrderDialog();
}, [openReceiveOrderDialog]);

  // ===== 得意先検索ダイアログ =====
  const { open: openCustomerDialog, searchDialogProps: customerSearchDialogProps } =
    useCommonSearchDialogProps<any>('customer', async (c) => {
      if (!mountedRef.current) return true;

      setState((prev) => {
        const nextAddress1FromCustomer = `${c?.prefectures ?? ''}${c?.municipality ?? ''}`.trim();

        const isSend01 = to01((prev as any)?.is_send ?? (prev as any)?.send_flg ?? 0);
        const isSendBool = toBool((prev as any)?.is_send ?? (prev as any)?.send_flg ?? 0);

        const next: SalesDetailPageState = {
          ...prev,
          customer_id: c?.id ?? prev.customer_id,
          customer_name: (c?.name as string) ?? prev.customer_name ?? '上様',
          send_flg: isSendBool,
          is_send: isSend01,
          corporate_class:
            typeof c?.corporate_class === 'number' ? c.corporate_class : prev.corporate_class,
          rate: typeof c?.rate === 'number' ? c.rate : prev.rate,
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
    });

  // ===== 担当者検索ダイアログ =====
  const { open: openUserDialog, searchDialogProps: userSearchDialogProps } =
    useCommonSearchDialogProps<any>('user', async (u) => {
      if (!mountedRef.current) return true;

      setState((prev) => ({
        ...prev,
        user_id: u?.id ?? prev.user_id,
        user_name: u?.name ?? prev.user_name,
      }));

      if (!mountedRef.current) return true;
      setErrors(undefined);
      return true;
    });

  const getNewData: () => Promise<boolean> = async () => {
    safeDispatch(AppActions.request());
    try {
      const res = await axios.get(`/api/${slug}/edit/`);

      if (res.status === 200) {
        const st = toState(res.data?.data ?? { details: [] }) as any;
        st.details = Array.isArray(st.details) ? st.details : [];

        const isSend01 = to01(st.is_send ?? st.send_flg ?? 0);
        st.is_send = isSend01;
        st.send_flg = toBool(isSend01);

        const baseDate = st.sales_at || st.sales_date || state.sales_at;
        const resolvedSalesTaxRate = getRate(baseDate) || st.sales_tax_rate || 0;

        if (!mountedRef.current) return true;

        setState((prev) => ({
          ...prev,
          ...st,
          sales_tax_rate: resolvedSalesTaxRate,
          fraction: 1,
        }));

        if (!mountedRef.current) return true;
        setErrors(undefined);
        safeDispatch(AppActions.success());
        return true;
      }

      safeDispatch(AppActions.success());
      return false;
    } catch (e) {
      safeDispatch(AppActions.failed('新規データの取得に失敗しました。'));
      return false;
    }
  };

  const applyFetchedSalesState = useCallback(
    (raw: any, receive_order_id_override?: number | undefined) => {
      const st = toState(raw ?? { details: [] }) as any;
      st.details = Array.isArray(st.details) ? st.details : [];

      // ★取得時点で receive_order_detail_id を記憶（受注起点/編集の両方に効く）
      rememberReceiveDetailIds(st.details);

      const isSend01 = to01(st.is_send ?? st.send_flg ?? 0);
      st.is_send = isSend01;
      st.send_flg = toBool(isSend01);

      const sales_tax_rate = getRate(st.sales_at) || st.sales_tax_rate || 0;
      const has_invoice = st.has_invoice == 1;

      const delivery = raw?.delivery;
      if (delivery) {
        st.name = delivery?.recipient_name ?? st.name ?? '';
        st.zip_code = delivery?.zip_code ?? st.zip_code ?? '';
        st.address1 = `${delivery?.prefectures ?? ''}${delivery?.municipality ?? ''}` || st.address1 || '';
        st.address2 = delivery?.number ?? st.address2 ?? '';
        st.tel = delivery?.tel ?? st.tel ?? '';
      }

      setState((prev) => ({
        ...prev,
        ...st,
        sales_tax_rate,
        fraction: 1,
        has_invoice,
        ...(receive_order_id_override ? { receive_order_id: receive_order_id_override } : {}),
      }));
    },
    [getRate, setState, toState, rememberReceiveDetailIds],
  );

  const get: (id: number | undefined) => Promise<boolean> = async (idArg) => {
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
        if (!mountedRef.current) return true;

        applyFetchedSalesState(res.data?.data, from_receive ? receive_order_id : undefined);

        if (!mountedRef.current) return true;
        setErrors(undefined);
        safeDispatch(AppActions.success());
        return true;
      } else {
        safeDispatch(AppActions.success());
        history.push('/404');
      }
    } catch (e) {
      safeDispatch(AppActions.failed('データの取得に失敗しました。'));
    }

    return false;
  };

  const refreshByReceiveOrderId = useCallback(
    async (receiveOrderId: number): Promise<boolean> => {
      if (!receiveOrderId) return false;

      safeDispatch(AppActions.request());
      try {
        const res = await axios.get(`/api/${slug}/edit_by_receive_id/${receiveOrderId}`);
        if (res.status === 200) {
          if (!mountedRef.current) return true;

          applyFetchedSalesState(res.data?.data, receiveOrderId);

          if (!mountedRef.current) return true;
          setErrors(undefined);
          safeDispatch(AppActions.success());
          return true;
        }

        safeDispatch(AppActions.success());
        return false;
      } catch (e) {
        safeDispatch(AppActions.failed('データの取得に失敗しました。'));
        return false;
      }
    },
    [applyFetchedSalesState, safeDispatch, setErrors, slug],
  );

  const validate: () => Promise<boolean> = async () => {
    safeDispatch(AppActions.request());
    try {
      const res = await axios.post(`/api/${slug}/validate_edit/${id}`, buildPayload());

      if (handleApiErrors200(res)) {
        safeDispatch(AppActions.success());
        return false;
      }

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
    } catch (e) {
      if (handleValidationError(e)) return false;
      safeDispatch(AppActions.failed('検証に失敗しました。'));
    }
    return false;
  };

  const edit: (id: number) => Promise<boolean> = async (idArg) => {
    safeDispatch(AppActions.request());
    try {
      const res = await axios.put(`/api/${slug}/edit/${idArg}`, buildPayload());

      if (handleApiErrors200(res)) {
        safeDispatch(AppActions.success());
        return false;
      }

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
    } catch (e) {
      if (handleValidationError(e)) return false;
      safeDispatch(AppActions.failed('データの保存に失敗しました。'));
    }
    return false;
  };

  const output: (doc_type: string) => Promise<boolean> = async (doc_type) => {
    safeDispatch(AppActions.request());
    try {
      const res = await axios.post(`/api/${slug}/output/${doc_type}`, buildPayload());

      if (handleApiErrors200(res)) {
        safeDispatch(AppActions.success());
        return false;
      }

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
    } catch (e) {
      if (handleValidationError(e)) return false;
      safeDispatch(AppActions.failed('印刷に失敗しました。'));
    }
    return false;
  };

  // --- Square 系（変更なし） ---
  const onClickSquareComplete: () => Promise<boolean> = useCallback(async () => {
    const roIdRaw =
      (state as any)?.receive_order_id ?? (from_receive ? id : undefined);

    const roId = Number(roIdRaw ?? 0);
    if (!roId || roId <= 0) {
      await appAlert('受注IDが取得できないため、決済処理できません。');
      return false;
    }

    const payId = normStr((state as any)?.square_payment_id);
    if (!payId) {
      await appAlert('Square決済IDが無いため、決済処理できません。');
      return false;
    }

    if (!(await appConfirm('カード決済を確定しますか？'))) return false;

    safeDispatch(AppActions.request());
    try {
      const res = await axios.post(`/api/receive_order/${roId}/square/complete`, {});

      if (res?.status === 200 && res.data?.success === false) {
        safeDispatch(AppActions.success());
        const msg =
          (res.data?.errors && (res.data.errors.message || res.data.errors.square_status)) ||
          res.data?.message ||
          '決済に失敗しました。';
        await appAlert(String(msg));
        return false;
      }

      if (res?.status === 200 && res.data?.success) {
        safeDispatch(AppActions.success());
        await refreshByReceiveOrderId(roId);
        await appAlert('決済を確定しました。');
        return true;
      }

      safeDispatch(AppActions.failed('決済に失敗しました。'));
      return false;
    } catch (e) {
      safeDispatch(AppActions.failed('決済に失敗しました。'));
      return false;
    }
  }, [from_receive, id, refreshByReceiveOrderId, safeDispatch, state]);

  const onClickSquareCancel: () => Promise<boolean> = useCallback(async () => {
    const roIdRaw =
      (state as any)?.receive_order_id ?? (from_receive ? id : undefined);

    const roId = Number(roIdRaw ?? 0);
    if (!roId || roId <= 0) {
      await appAlert('受注IDが取得できないため、キャンセルできません。');
      return false;
    }

    const payId = normStr((state as any)?.square_payment_id);
    if (!payId) {
      await appAlert('Square決済IDが無いため、キャンセルできません。');
      return false;
    }

    if (!(await appConfirm('この注文をキャンセルしますか？'))) return false;

    safeDispatch(AppActions.request());
    try {
      const res = await axios.post(`/api/receive_order/${roId}/square/cancel`, {});

      if (res?.status === 200 && res.data?.success === false) {
        safeDispatch(AppActions.success());
        const msg =
          (res.data?.errors && (res.data.errors.message || res.data.errors.square_status)) ||
          res.data?.message ||
          'キャンセルに失敗しました。';
        await appAlert(String(msg));
        return false;
      }

      if (res?.status === 200 && res.data?.success) {
        safeDispatch(AppActions.success());
        await refreshByReceiveOrderId(roId);
        await appAlert('注文をキャンセルしました。');
        return true;
      }

      safeDispatch(AppActions.failed('キャンセルに失敗しました。'));
      return false;
    } catch (e) {
      safeDispatch(AppActions.failed('キャンセルに失敗しました。'));
      return false;
    }
  }, [from_receive, id, refreshByReceiveOrderId, safeDispatch, state]);

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

    const newId = await create();

    if (newId === -1) {
      window.scrollTo(0, 0);
      return;
    }

    let finalId = newId;
    if (!finalId || Number(finalId) <= 0) {
      finalId = await commonStore();
    }

    if (finalId && Number(finalId) > 0) {
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
        const newId = await create();
        if (newId === -1) {
          window.scrollTo(0, 0);
          return;
        }

        let finalId = newId;
        if (!finalId || Number(finalId) <= 0) {
          finalId = await commonStore();
        }

        if (finalId > 0) {
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
        const newId = await create();
        if (newId === -1) {
          window.scrollTo(0, 0);
          return;
        }

        let finalId = newId;
        if (!finalId || Number(finalId) <= 0) {
          finalId = await commonStore();
        }

        if (finalId > 0) {
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
    openReceiveOrderDialog: openReceiveOrderDialogWithLog, // ★差し替え
    customerSearchDialogProps,
    openCustomerDialog,
    userSearchDialogProps,
    openUserDialog,
    onClickSave,
    onClickPrintDelivery,
    onClickPrintInvoice,
    onClickSquareComplete,
    onClickSquareCancel,
  };
};
