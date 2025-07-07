import { useState } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { PageErrors } from '@/types';
import { AppActions } from '@/app/App/modules/appModule';
import { createUrl } from '@/app/Item/utils/createUrl';
import { TEMPLATE_ITEM_URLS } from '@/constants/TEMPLATE_ITEM_URLS';

type TopPageState = {
  c_item_number: string | undefined;
};

export const useTopPage = () => {
  const dispatch = useDispatch();
  const [state, setState] = useState<TopPageState>({
    c_item_number: undefined,
  });
  const [errors, setErrors] = useState<PageErrors>(undefined);
  const [isFetching, setFetching] = useState(false);

  const fetch: () => Promise<boolean> = async () => {
    setFetching(true);
    dispatch(AppActions.request());
    const res = await axios.post('/api/item/get_id', state);

    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        setErrors(undefined);

        const { id, item_number } = res.data.data;
        window.open(`/item/detail/${id}`, '_blank');

        const domestic_url = createUrl(TEMPLATE_ITEM_URLS.template_domestic_url, item_number);
        const overseas_url = createUrl(TEMPLATE_ITEM_URLS.template_overseas_url, item_number);

        window.open(domestic_url, '_blank');
        window.open(overseas_url, '_blank');

        setFetching(false);
        return true;
      } else {
        setErrors(res.data.errors);
      }
    } else {
      dispatch(AppActions.failed('データの取得に失敗しました。'));
    }
    setFetching(false);
    return false;
  };

  const onChange: (e: React.ChangeEvent<HTMLInputElement>) => void = e => {
    setState({ ...state, [e.currentTarget.name]: e.currentTarget.value });
    setErrors({ ...errors, [e.currentTarget.name]: '' });
  };

  const onClick: () => void = async () => {
    await fetch();
  };

  return {
    state,
    errors,
    isFetching,
    onChange,
    onClick,
  };
};
