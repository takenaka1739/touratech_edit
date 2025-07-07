import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import toNumber from 'lodash/toNumber';
import { Config, PageErrors } from '@/types';
import { AppActions } from '@/app/App/modules/appModule';
import { appAlert } from '@/components';

/**
 * 環境設定画面用 hooks
 */
export const useConfigDetailPage = () => {
  const dispatch = useDispatch();
  const [state, setState] = useState<Config>({
    company_name: '',
    zip_code: '',
    address1: '',
    address2: '',
    tel: '',
    fax: '',
    email: '',
    company_class: 1,
    company_level: 'A',
    bank_name1: '',
    branch_name1: '',
    account_name1: '',
    account_type1: '',
    account_number1: '',
    bank_name2: '',
    branch_name2: '',
    account_name2: '',
    account_type2: '',
    account_number2: '',
    sales_tax_rate: undefined,
    pre_tax_rate: undefined,
    tax_rate_change_date: undefined,
    currencies: [],
    cods: [],
  });
  const [errors, setErrors] = useState<PageErrors>(undefined);
  const [isDisabled, setDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const history = useHistory();

  const backPage = () => history.push(`/`);

  const toState: (data: Config) => Config = data => {
    const { cods, ...props } = data;
    const _cods = cods.map(x => {
      return { ...x, border: toNumber(x.border), amount: toNumber(x.amount) };
    });
    return {
      ...props,
      cods: _cods,
    };
  };

  const get: () => Promise<boolean> = async () => {
    dispatch(AppActions.request());
    const res = await axios.get('/api/config');

    if (res.status === 200) {
      dispatch(AppActions.success());
      setState(toState(res.data.data));
      return true;
    } else {
      dispatch(AppActions.failed('データの取得に失敗しました。'));
    }
    return false;
  };

  const edit: () => Promise<boolean> = async () => {
    dispatch(AppActions.request());
    const res = await axios.put(`/api/config/edit`, state);

    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        dispatch(AppActions.setConfig(state));
        return true;
      } else {
        setErrors(res.data.errors);
      }
    } else {
      dispatch(AppActions.failed('データの保存に失敗しました。'));
    }
    return false;
  };

  useEffect(() => {
    get().then(ret => {
      if (ret) {
        setIsLoading(false);
      }
    });
  }, []);

  const onChange: (name: string, value: string | number | boolean | undefined) => void = (
    name,
    value
  ) => {
    setState({ ...state, [name]: value });
  };

  const onChangeRate: (name: string, value: string | number | boolean | undefined) => void = (
    name,
    value
  ) => {
    const matches = name.match(/\d/);
    if (matches != null) {
      const num = parseInt(matches[0]);
      const currencies = state.currencies;
      currencies[num].rate = toNumber(value ?? 0);
      setState({ ...state, currencies });
    }
  };

  const onChangeCodAmount: (name: string, value: string | number | boolean | undefined) => void = (
    name,
    value
  ) => {
    const matches = name.match(/\d/);
    if (matches != null) {
      const num = parseInt(matches[0]);
      const cods = state.cods;
      cods[num].amount = toNumber(value ?? 0);
      setState({ ...state, cods });
    }
  };

  const onClickSave: () => void = async () => {
    setDisabled(false);
    if (await edit()) {
      await appAlert('保存しました。');
      setDisabled(true);
      backPage();
      return;
    } else {
      window.scrollTo(0, 0);
    }
    setDisabled(true);
  };

  return {
    isLoading,
    state,
    errors,
    isDisabled,
    onChange,
    onChangeRate,
    onChangeCodAmount,
    onClickSave,
  };
};
