import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { PageErrors } from '@/types';
import { AppActions } from '@/app/App/modules/appModule';

type SimpleSearchDetailPageState = {
  item_number: string | undefined;
  name_jp: string | undefined;
  sales_unit_price: number | undefined;
  domestic_stock: number | undefined;
  overseas_stock: number | undefined;
};

const initialState: SimpleSearchDetailPageState = {
  item_number: '',
  name_jp: '',
  sales_unit_price: undefined,
  domestic_stock: undefined,
  overseas_stock: undefined,
};

export const useSimpleSearchDetailPage = (slug: string) => {
  const dispatch = useDispatch();
  const [conditions, setConditions] = useState<{
    c_item_number: string | undefined;
  }>({
    c_item_number: undefined,
  });
  const [state, setState] = useState<SimpleSearchDetailPageState>(initialState);
  const [errors, setErrors] = useState<PageErrors>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setFetching] = useState(false);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const fetch: () => Promise<boolean> = async () => {
    setFetching(true);
    dispatch(AppActions.request());
    const res = await axios.post(`/api/${slug}/get`, conditions);

    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        setErrors(undefined);
        setState(res.data.data);
        setFetching(false);
        return true;
      } else {
        setErrors(res.data.errors);
        setState(initialState);
      }
    } else {
      dispatch(AppActions.failed('データの取得に失敗しました。'));
    }
    setFetching(false);
    return false;
  };

  const onChange: (e: React.ChangeEvent<HTMLInputElement>) => void = e => {
    setConditions({ ...conditions, [e.currentTarget.name]: e.currentTarget.value });
  };

  const onClick: () => void = async () => {
    await fetch();
  };

  return {
    conditions,
    state,
    errors,
    isLoading,
    isFetching,
    onChange,
    onClick,
  };
};
