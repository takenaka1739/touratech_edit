
import { useState, useEffect } from 'react';
import isEqual from 'lodash/isEqual';
import { PageErrors } from '@/types';

// 特売設定画面用 hocks


type props = {
  id: number | undefined,
  item_id: number | undefined,
  is_sales_members_only: boolean | undefined,
  start_at?: string | undefined,
  end_at?: string | undefined,
  special_sale_price: number | undefined,
  refund_rate: number | undefined,
}

/**
 * 検索画面共通 hooks
 */
export const useSpecialSalesDialog = <T extends props>(initialState: T) => {
  const [state, setState] = useState(initialState);
  const [isShown, setIsShown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [conditions, setConditions] = useState(initialState);
  const [errors, setErrors] = useState<PageErrors>(undefined);

  useEffect(() => {setState(state)}, [initialState]);

  const onCancel: () => void = () => {
    setIsShown(false);
    setState(initialState);
  };

  const cleanup: () => void = () => {
    clear(false);
    setIsLoading(true);
  };

  const clear: (isFetch?: boolean) => void = (isFetch = true) => {
    if (isEqual(initialState, conditions)) {
      return;
    }
    if (isFetch) {
      //fetch(initialState);
    } else {
      setConditions(initialState);
    }
  };

  const onChange: (name: string, value: string | number | boolean | undefined) => void = (
    name,
    value
  ) => {
    setState({ ...state, [name]: value });
    setErrors({ ...errors, [name]: '' });
  };

  const onClickCancel = () => {
    onCancel();
    cleanup();
  };

  const open = () => {
    setIsShown(true);
    setState(initialState); // ← これがないと再表示時に古い値のまま
  }

  return {
    isShown,    
    open,
    isLoading,
    state,
    errors,
    onChange,
    onClickCancel,
    setState,
    setIsShown,
    setIsLoading,
    searchDialogProps: {
      isLoading,
      isShown,
      onClickCancel
    },
  };
};
