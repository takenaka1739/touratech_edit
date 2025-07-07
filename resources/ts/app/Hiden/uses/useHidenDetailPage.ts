import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { PageErrors } from '@/types';
import axios from 'axios';
import { appAlert } from '@/components';
import { format } from 'date-fns';
import { AppActions } from '@/app/App/modules/appModule';

export type Hiden = {
  c_sales_date_from: string;
  c_sales_date_to: string;
};

/**
 * 売上出力画面用 hooks
 */
export const useHidenDetailPage = (slug: string) => {
  const dispatch = useDispatch();
  const today = format(new Date(), 'yyyy/MM/dd');
  const [state, setState] = useState<Hiden>({
    c_sales_date_from: today,
    c_sales_date_to: today,
  });
  const [errors, setErrors] = useState<PageErrors>(undefined);
  const [isDisabled, setDisabled] = useState(false);

  const output: (csv_format: string) => Promise<boolean> = async (csv_format) => {
    dispatch(AppActions.request());

    const res = await axios.post(`/api/${slug}/output/${csv_format}`, state);
    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        setErrors(undefined);

        const { file_id, file_name } = res.data.data;
        const link = document.createElement('a');
        link.href = `/web/${slug}/output/${file_id}`;
        link.download = file_name;
        link.click();

        return true;
      } else {
        setErrors(res.data.errors);
      }
    } else {
      dispatch(AppActions.failed('出力に失敗しました。'));
    }
    return false;
  };

  const onChange: (name: string, value: string | number | boolean | undefined) => void = (
    name,
    value
  ) => {
    setState({ ...state, [name]: value });
    setErrors({ ...errors, [name]: '' });
  };

  const onClickOutputB2: () => void = async () => {
    setDisabled(true);
    if (await output('B2')) {
      await appAlert('正常に出力されました。');
    } else {
      window.scrollTo(0, 0);
    }
    setDisabled(false);
  };

  const onClickOutputHiden: () => void = async () => {
    setDisabled(true);
    if (await output('Hiden')) {
      await appAlert('正常に出力されました。');
    } else {
      window.scrollTo(0, 0);
    }
    setDisabled(false);
  };

  return {
    state,
    errors,
    isDisabled,
    onChange,
    onClickOutputB2,
    onClickOutputHiden,
  };
};
