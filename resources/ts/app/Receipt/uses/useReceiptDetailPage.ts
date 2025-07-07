import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { Receipt, Customer, User, PageErrors } from '@/types';
import { appAlert, appConfirm } from '@/components';
import { useCommonSearchDialogProps } from '@/app/App/uses/useCommonSearchDialogProps';
import { useReceiptCustomerSearchDialogProps } from './useReceiptCustomerSearchDialogProps';
import { AppActions } from '@/app/App/modules/appModule';
import { useIdFromParams } from '@/uses';
import toNumber from 'lodash/toNumber';

type ReceiptDetailPageState = Receipt & {
  last_month_sales: number | undefined;
  accounts_receivable: number | undefined;
};

/**
 * 入金データ（詳細）画面用 hooks
 */
export const useReceiptDetailPage = (slug: string) => {
  const id = useIdFromParams();
  const dispatch = useDispatch();
  const [state, setState] = useState<ReceiptDetailPageState>({
    id: undefined,
    receipt_date: '',
    customer_id: undefined,
    customer_name: '上様',
    last_month_sales: undefined,
    accounts_receivable: undefined,
    user_id: undefined,
    user_name: undefined,
    total_amount: 0,
    remarks: undefined,
  });
  const [errors, setErrors] = useState<PageErrors>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const history = useHistory();
  const {
    open: openCustomerDialog,
    searchDialogProps: customerSearchDialogProps,
  } = useReceiptCustomerSearchDialogProps<Customer>(async props => {
    const { id, name, last_month_sales, accounts_receivable } = props;
    setState({
      ...state,
      customer_id: id,
      customer_name: name,
      last_month_sales,
      accounts_receivable,
    });
    return true;
  });
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

  const backPage = () => history.push(`/${slug}`);

  const get: (id: number | undefined) => Promise<boolean> = async id => {
    dispatch(AppActions.request());

    const res = await axios.get(`/api/${slug}/edit/${id ?? ''}`);

    if (res.status === 200) {
      const { total_amount, ...rest } = res.data.data;
      setState({ ...state, ...rest, total_amount: toNumber(total_amount) });

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
    customerSearchDialogProps,
    userSearchDialogProps,
    openCustomerDialog,
    openUserDialog,
    onChange,
    onClickSave,
    onClickDelete,
  };
};
