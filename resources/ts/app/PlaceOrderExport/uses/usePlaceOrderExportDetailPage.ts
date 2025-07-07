import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { PageErrors } from '@/types';
import { appAlert } from '@/components';
import axios from 'axios';
import { format } from 'date-fns';
import { AppActions } from '@/app/App/modules/appModule';

export type PlaceOrderExport = {
  c_place_order_date_from: string;
  c_place_order_date_to: string;
  c_is_output: boolean;
};

/**
 * 発注CSV出力画面用 hooks
 */
export const usePlaceOrderExportDetailPage = (slug: string) => {
  const dispatch = useDispatch();
  const today = format(new Date(), 'yyyy/MM/dd');
  const [state, setState] = useState<PlaceOrderExport>({
    c_place_order_date_from: today,
    c_place_order_date_to: today,
    c_is_output: false,
  });
  const [errors, setErrors] = useState<PageErrors>(undefined);
  const [isDisabled, setDisabled] = useState(false);

  const output: () => Promise<boolean> = async () => {
    dispatch(AppActions.request());

    const res = await axios.post(`/api/${slug}/output`, state);
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

  const onClickOutput: () => void = async () => {
    setDisabled(true);
    if (await output()) {
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
    onClickOutput,
  };
};
