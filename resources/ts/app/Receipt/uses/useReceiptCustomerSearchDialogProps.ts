import { useState } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { Customer } from '@/types';
import { AppActions } from '@/app/App/modules/appModule';

interface SearchDialog {
  id: number | undefined;
}

type ReceiptCustomer = Customer & {
  last_month_sales: number | undefined;
  accounts_receivable: number | undefined;
};

/**
 * 検索ダイアログ表示共通 hooks
 *
 * @param selectedFunc
 */
export const useReceiptCustomerSearchDialogProps = <T extends SearchDialog>(
  selectedFunc: (props: ReceiptCustomer) => Promise<boolean>
) => {
  const dispatch = useDispatch();
  const [isShown, setIsShown] = useState(false);

  const onSelected: (props: T) => Promise<boolean> = async props => {
    if (props.id) {
      dispatch(AppActions.request());
      const res = await axios.get(`/api/receipt/customer_selected/${props.id}`);

      if (res.status === 200) {
        dispatch(AppActions.success());
        if (!(await selectedFunc(res.data.data))) {
          return false;
        }
      } else {
        dispatch(AppActions.failed('一覧の取得に失敗しました。'));
      }
    } else {
      dispatch(AppActions.failed('一覧の取得に失敗しました。'));
    }
    setIsShown(false);
    return true;
  };

  return {
    open: () => setIsShown(true),
    searchDialogProps: {
      isShown,
      onSelected,
      onCancel: () => setIsShown(false),
    },
  };
};
