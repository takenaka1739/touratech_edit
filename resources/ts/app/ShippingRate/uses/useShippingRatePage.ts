import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import toNumber from 'lodash/toNumber';
import { AppActions } from '@/app/App/modules/appModule';
import { appAlert } from '@/components';
import { PageErrors } from '@/types';
import { RemoteIslandShippingRate, ShippingRateState } from '../types';

export const useShippingRatePage = () => {
  const dispatch = useDispatch();
  const [state, setState] = useState<ShippingRateState>({
    free_shipping_thresholds: {
      send_personal: undefined,
      send_trader: undefined,
    },
    prefecture_rates: [],
    remote_island_rates: [],
  });
  const [errors, setErrors] = useState<PageErrors>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const get = async () => {
    dispatch(AppActions.request());
    const res = await axios.get('/api/shipping_rate');
    if (res.status === 200) {
      dispatch(AppActions.success());
      const data = res.data.data as ShippingRateState;
      setState({
        free_shipping_thresholds: {
          send_personal: toNumber(data.free_shipping_thresholds?.send_personal ?? 0),
          send_trader: toNumber(data.free_shipping_thresholds?.send_trader ?? 0),
        },
        prefecture_rates: data.prefecture_rates.map(x => ({ ...x, amount: toNumber(x.amount) })),
        remote_island_rates: data.remote_island_rates.map(x => ({ ...x, amount: toNumber(x.amount) })),
      });
      return true;
    }
    dispatch(AppActions.failed('データの取得に失敗しました。'));
    return false;
  };

  useEffect(() => {
    get().then(() => setIsLoading(false));
  }, []);

  const onChangePrefectureAmount = (index: number, value: string | number | boolean | undefined) => {
    const prefecture_rates = [...state.prefecture_rates];
    prefecture_rates[index] = { ...prefecture_rates[index], amount: toNumber(value ?? 0) };
    setState({ ...state, prefecture_rates });
    setErrors({ ...errors, [`prefecture_rates.${index}.amount`]: '' });
  };

  const onChangeRemoteIslandAmount = (index: number, value: string | number | boolean | undefined) => {
    const remote_island_rates = [...state.remote_island_rates];
    remote_island_rates[index] = {
      ...remote_island_rates[index],
      amount: toNumber(value ?? 0),
    };
    setState({ ...state, remote_island_rates });
    setErrors({ ...errors, [`remote_island_rates.${index}.amount`]: '' });
  };

  const onChangeFreeShippingThreshold = (
    name: keyof ShippingRateState['free_shipping_thresholds'],
    value: string | number | boolean | undefined
  ) => {
    setState({
      ...state,
      free_shipping_thresholds: {
        ...state.free_shipping_thresholds,
        [name]: toNumber(value ?? 0),
      },
    });
    setErrors({ ...errors, [`free_shipping_thresholds.${name}`]: '' });
  };

  const onClickSave = async () => {
    setIsSaving(true);
    dispatch(AppActions.request());
    const payload: ShippingRateState = {
      free_shipping_thresholds: state.free_shipping_thresholds,
      prefecture_rates: state.prefecture_rates.map((row, index) => ({
        ...row,
        sort_order: index + 1,
      })),
      remote_island_rates: state.remote_island_rates.map((row, index) => ({
        ...row,
        sort_order: index + 1,
      })),
    };
    const res = await axios.put('/api/shipping_rate/edit', payload);
    setIsSaving(false);

    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        setErrors(undefined);
        await appAlert('保存しました。');
        await get();
        return;
      }
      setErrors(res.data.errors);
      window.scrollTo(0, 0);
      return;
    }

    dispatch(AppActions.failed('データの保存に失敗しました。'));
  };

  return {
    state,
    errors,
    isLoading,
    isSaving,
    onChangePrefectureAmount,
    onChangeRemoteIslandAmount,
    onChangeFreeShippingThreshold,
    onClickSave,
  };
};
