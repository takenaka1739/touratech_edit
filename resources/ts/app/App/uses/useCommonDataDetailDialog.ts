import { useState } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { PageErrors } from '@/types';
import { AppActions } from '@/app/App/modules/appModule';

/**
 * データ（明細）画面共通 hooks
 */
export const useCommonDataDetailDialog = <T>(slug: string) => {
  const dispatch = useDispatch();
  const [errors, setErrors] = useState<PageErrors>(undefined);

  const save: (state: T) => Promise<boolean> = async state => {
    dispatch(AppActions.request());
    const res = await axios.post(`/api/${slug}/detail`, state);

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
