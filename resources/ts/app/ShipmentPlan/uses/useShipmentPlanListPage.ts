import React, { useCallback, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import toNumber from 'lodash/toNumber';
import { RootState } from '@/store';
import { ShipmentPlan, Pager, PageErrors } from '@/types';
import {
  ShipmentPlanListPageConditionState,
  ShipmentPlanListPageActions,
  shipmentPlanInitialState,
} from '../modules/shipmentPlanListPageModule';
import { AppActions } from '@/app/App/modules/appModule';
import { appAlert, appConfirm } from '@/components';
import { ShipmentPlanListError } from '../components/ShipmentPlanListError';

/**
 * 仕入予定一覧画面用 hooks
 */
export const useShipmentPlanListPage = (slug: string) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [state, setState] = useState<{
    rows: ShipmentPlan[];
    pager: Pager | undefined;
    selected: number[];
  }>({
    rows: [],
    pager: undefined,
    selected: [],
  });
  const [errors, setErrors] = useState<PageErrors>(undefined);
  const conditions = useConditions();
  const initialConditions = shipmentPlanInitialState.conditions;

  const setConditions = useCallback(
    (conditions: ShipmentPlanListPageConditionState) =>
      dispatch(ShipmentPlanListPageActions.setConditions(conditions)),
    [dispatch]
  );

  const fetch: (props: ShipmentPlanListPageConditionState) => Promise<boolean> = async props => {
    dispatch(AppActions.request());
    const res = await axios.post(`/api/${slug}/fetch`, { ...conditions, ...props });

    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        setErrors(undefined);
        setConditions({ ...conditions, ...props });
        setState({ ...state, ...res.data.data, selected: [] });
        return true;
      } else {
        setErrors(res.data.errors);
      }
    } else {
      dispatch(AppActions.failed('一覧の取得に失敗しました。'));
    }
    return false;
  };

  const clear: () => void = () => {
    setConditions(initialConditions);
    setState({ rows: [], pager: undefined, selected: [] });
  };

  const validate: () => Promise<boolean> = async () => {
    if (!state.selected || state.selected.length === 0) {
      await appAlert('対象を選択してください。');
      return false;
    }

    dispatch(AppActions.request());

    const res = await axios.post(`/api/${slug}/validate_bulk_purchase`, {
      selected: state.selected,
      ...conditions,
    });
    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        setErrors(undefined);
        return true;
      } else {
        const { item_numbers, ...rest } = res.data.errors;
        if (item_numbers) {
          await appAlert(ShipmentPlanListError(res.data.errMsg, item_numbers), 'error');
        }
        setErrors(rest);
      }
    } else {
      dispatch(AppActions.failed('一括仕入に失敗しました。'));
    }
    return false;
  };

  const bulkPurchase: () => Promise<boolean> = async () => {
    dispatch(AppActions.request());

    const res = await axios.post(`/api/${slug}/bulk_purchase`, {
      selected: state.selected,
      ...conditions,
    });
    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        setErrors(undefined);
        return true;
      } else {
        setErrors(res.data.errors);
      }
    } else {
      dispatch(AppActions.failed('一括仕入に失敗しました。'));
    }
    return false;
  };

  const output: (isPrintPrice: boolean) => Promise<boolean> = async isPrintPrice => {
    if (!state.selected || state.selected.length === 0) {
      await appAlert('対象を選択してください。');
      return false;
    }

    dispatch(AppActions.request());

    const res = await axios.post(`/api/${slug}/output`, {
      selected: state.selected,
      ...conditions,
      isPrintPrice,
    });
    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        setErrors(undefined);

        const { file_id } = res.data.data;
        const link = document.createElement('a');
        link.href = `/web/${slug}/output/${file_id}`;
        link.target = '_blank';
        link.click();

        return true;
      } else {
        setErrors(res.data.errors);
      }
    } else {
      dispatch(AppActions.failed('印刷に失敗しました。'));
    }
    return false;
  };

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const onChangeSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = toNumber(e.currentTarget.dataset.id);
    if (e.currentTarget.checked) {
      const selected = state.selected.concat([id]);
      setState({ ...state, selected });
    } else {
      const selected = state.selected.filter(x => {
        return x !== id;
      });
      setState({ ...state, selected });
    }
  };

  const onChange: (name: string, value: string | number | boolean | undefined) => void = (
    name,
    value
  ) => {
    setConditions({ ...conditions, [name]: value });
    setErrors({ ...errors, [name]: '' });
  };

  const onClickSearchButton: () => void = () => {
    fetch({ page: 1 });
  };

  const onClickClearButton: () => void = () => {
    clear();
  };

  const onChangePage = useCallback(
    (page: number) => {
      if (conditions.page == page) {
        return;
      }

      fetch({ page });
    },
    [conditions.page, fetch]
  );

  const onClickBulkPurchase: () => void = async () => {
    if (await validate()) {
      if (
        await appConfirm('選択されているデータから一括で仕入データを作成します　よろしいですか？')
      ) {
        if (await bulkPurchase()) {
          await appAlert('一括仕入を完了しました。');
          fetch({ ...conditions, page: 1 });
        }
      }
    }
  };

  const onClickPrint: () => void = async () => {
    await output(true);
  };

  const onClickPrintNoPrice: () => void = async () => {
    await output(false);
  };

  const onClickSelectButton: () => void = () => {
    const selected = state.rows.map(x => {
      return x.id ?? 0;
    });
    setState({ ...state, selected });
  };

  const onClickUnSelectButton: () => void = () => {
    setState({ ...state, selected: [] });
  };

  return {
    isLoading,
    state,
    errors,
    conditions,
    onChange,
    onClickSearchButton,
    onClickClearButton,
    onChangePage,
    onClickBulkPurchase,
    onClickPrint,
    onClickPrintNoPrice,
    onChangeSelected,
    onClickSelectButton,
    onClickUnSelectButton,
  };
};

export const useConditions = () => {
  return useSelector((state: RootState) => state.shipmentPlanListPage.conditions);
};
