import { useState } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { PageErrors, SetItemDetail } from '@/types';
import { AppActions } from '@/app/App/modules/appModule';

/**
 * セット品マスタ（明細）画面用 hooks
 */
export const useSetItemDetailDialog = () => {
  const dispatch = useDispatch();
  const [errors, setErrors] = useState<PageErrors>(undefined);

  const save: (state: SetItemDetail) => Promise<boolean> = async state => {
    dispatch(AppActions.request());
    const res = await axios.post(`/api/set_item/detail`, state);

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

  return {
    errors,
    setErrors,
    save,
  };
};
