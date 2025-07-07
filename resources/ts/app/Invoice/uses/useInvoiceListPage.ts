import React, { useCallback, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios, { Canceler } from 'axios';
import toNumber from 'lodash/toNumber';
import { RootState } from '@/store';
import { Invoice, Pager, PageErrors } from '@/types';
import {
  InvoiceListPageConditionState,
  InvoiceListPageActions,
  invoiceInitialState,
} from '../modules/invoiceListPageModule';
import { AppActions } from '@/app/App/modules/appModule';
import { appAlert, appConfirm } from '@/components';

/**
 * 請求データ一覧画面用 hooks
 */
export const useInvoiceListPage = (slug: string) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [state, setState] = useState<{
    rows: Invoice[];
    pager: Pager | undefined;
    selected: number[];
  }>({
    rows: [],
    pager: undefined,
    selected: [],
  });
  const [errors, setErrors] = useState<PageErrors>(undefined);
  const conditions = useConditions();
  const initialConditions = invoiceInitialState.conditions;
  let cancel: Canceler | null = null;

  const setConditions = useCallback(
    (conditions: InvoiceListPageConditionState) =>
      dispatch(InvoiceListPageActions.setConditions(conditions)),
    [dispatch]
  );

  const fetch: (props: InvoiceListPageConditionState) => Promise<boolean> = async props => {
    if (cancel) {
      cancel();
    }

    dispatch(AppActions.request());
    const res = await axios.post(
      `/api/${slug}/fetch`,
      { ...conditions, ...props },
      {
        cancelToken: new axios.CancelToken(c => {
          cancel = c;
        }),
      }
    );

    if (res) {
      if (res.status === 200) {
        dispatch(AppActions.success());

        if (res.data.success) {
          setConditions({ ...conditions, ...props });

          const { rows, ...rest } = res.data.data;
          const _rows = rows.map((x: Invoice) => {
            return {
              ...x,
              pre_amount: toNumber(x.pre_amount),
              total_receipt: toNumber(x.total_receipt),
              total_amount: toNumber(x.total_amount),
              total_tax: toNumber(x.total_tax),
              total_invoice: toNumber(x.total_invoice),
            };
          });
          setState({ ...state, ...rest, rows: _rows, selected: [] });
          setErrors(undefined);
          return true;
        } else {
          setErrors(res.data.errors);
        }
      } else {
        dispatch(AppActions.failed('一覧の取得に失敗しました。'));
      }
    }
    return false;
  };

  const clear: () => void = () => {
    setConditions(initialConditions);
    setState({ ...state, rows: [] });
  };

  const validate: () => Promise<boolean> = async () => {
    dispatch(AppActions.request());

    const res = await axios.post(`/api/${slug}/validate_closing`, conditions);
    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        setErrors(undefined);

        let message = '';
        if (res.data.data.has_closing) {
          message =
            '入力された請求月の締め処理を行います。\n既存のデータは削除され、再作成されます。よろしいですか?';
        } else {
          message = '入力された請求月の締め処理を行います。\nよろしいですか?';
        }
        if (await appConfirm(message)) {
          return true;
        } else {
          return false;
        }
      } else {
        setErrors(res.data.errors);
      }
    } else {
      dispatch(AppActions.failed('月締処理に失敗しました。'));
    }
    return false;
  };

  const closing: () => Promise<boolean> = async () => {
    dispatch(AppActions.request());

    const res = await axios.post(`/api/${slug}/closing`, conditions);
    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        setErrors(undefined);

        return true;
      } else {
        setErrors(res.data.errors);
      }
    } else {
      dispatch(AppActions.failed('月締処理に失敗しました。'));
    }
    return false;
  };

  const cancelValidate: () => Promise<boolean> = async () => {
    dispatch(AppActions.request());

    const res = await axios.post(`/api/${slug}/validate_closing`, conditions);
    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        setErrors(undefined);

        if (await appConfirm('入力された請求月の請求データの削除を行います。　よろしいですか？')) {
          return true;
        } else {
          return false;
        }
      } else {
        setErrors(res.data.errors);
      }
    } else {
      dispatch(AppActions.failed('月締処理に失敗しました。'));
    }
    return false;
  };

  const cancelClosing: () => Promise<boolean> = async () => {
    dispatch(AppActions.request());

    const res = await axios.post(`/api/${slug}/cancel_closing`, conditions);
    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        setErrors(undefined);

        return true;
      } else {
        setErrors(res.data.errors);
      }
    } else {
      dispatch(AppActions.failed('締取消に失敗しました。'));
    }
    return false;
  };

  const outputInvoice: () => Promise<boolean> = async () => {
    if (!state.selected || state.selected.length === 0) {
      await appAlert('対象を選択してください。');
      return false;
    }

    dispatch(AppActions.request());

    const res = await axios.post(`/api/${slug}/output_invoice`, { selected: state.selected });
    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        setErrors(undefined);

        const { file_id } = res.data.data;
        const link = document.createElement('a');
        link.href = `/web/${slug}/output_invoice/${file_id}`;
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

  const outputList: () => Promise<boolean> = async () => {
    if (!state.selected || state.selected.length === 0) {
      await appAlert('対象を選択してください。');
      return false;
    }

    dispatch(AppActions.request());

    const res = await axios.post(`/api/${slug}/output_list`, {
      c_invoice_month: conditions.c_invoice_month,
      selected: state.selected,
    });
    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        setErrors(undefined);

        const { file_id } = res.data.data;
        const link = document.createElement('a');
        link.href = `/web/${slug}/output_list/${file_id}`;
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
    setIsLoading(false);
  }, []);

  const onChangeSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = toNumber(e.currentTarget.dataset.id);
    if (e.currentTarget.checked) {
      const selected = state.selected.concat([id]);
      setState({ ...state, selected });
    } else {
      const selected = state.selected.filter(x => {
        return x !== id;
      });
      setState({ ...state, selected });
    }
  };

  const onChange: (name: string, value: string | number | boolean | undefined) => void = (
    name,
    value
  ) => {
    setConditions({ ...conditions, [name]: value });
    setErrors({ ...errors, [name]: '' });
  };

  const onClickSearchButton: () => void = () => {
    fetch({ page: 1 });
  };

  const onClickClearButton: () => void = () => {
    clear();
  };

  const onChangePage = useCallback(
    (page: number) => {
      if (conditions.page == page) {
        return;
      }

      fetch({ page });
    },
    [conditions.page, fetch]
  );

  const onClickClosing: () => void = async () => {
    if (await validate()) {
      if (await closing()) {
        await appAlert('月締処理を完了しました。');
        fetch({ ...conditions, page: 1 });
      }
    }
  };

  const onClickPrintInvoice: () => void = async () => {
    await outputInvoice();
  };

  const onClickPrintList: () => void = async () => {
    await outputList();
  };

  const onClickSelectButton: () => void = () => {
    const selected = state.rows.map(x => {
      return x.id ?? 0;
    });
    setState({ ...state, selected });
  };

  const onClickUnSelectButton: () => void = () => {
    setState({ ...state, selected: [] });
  };

  const onClickCancelClosing: () => void = async () => {
    if (await cancelValidate()) {
      if (await cancelClosing()) {
        await appAlert('締取消を完了しました。');
        fetch({ ...conditions, page: 1 });
      }
    }
  };

  return {
    isLoading,
    state,
    errors,
    conditions,
    onChange,
    onClickSearchButton,
    onClickClearButton,
    onChangePage,
    onClickClosing,
    onClickPrintInvoice,
    onClickPrintList,
    onChangeSelected,
    onClickSelectButton,
    onClickUnSelectButton,
    onClickCancelClosing,
  };
};

export const useConditions = () => {
  return useSelector((state: RootState) => state.invoiceListPage.conditions);
};
