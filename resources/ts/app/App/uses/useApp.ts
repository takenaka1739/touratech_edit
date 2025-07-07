import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { initialize, AppActions } from '@/app/App/modules/appModule';

/**
 * アプリケーション用 hooks
 */
export const useApp: () => {
  init: () => void;
  clearError: () => void;
} = () => {
  const dispatch = useDispatch();

  const init: () => void = () => {
    useEffect(() => {
      dispatch(initialize({}));
    }, []);
  };

  const clearError: () => void = useCallback(() => dispatch(AppActions.clearError()), [dispatch]);

  return {
    init,
    clearError,
  };
};

export const useIsInitialized = () => {
  return useSelector((state: RootState) => state.app.isInitialized);
};

export const useIsLoading = () => {
  return useSelector((state: RootState) => state.app.isLoading);
};

export const useIsAdmin = () => {
  return useSelector((state: RootState) => state.app.auth?.role) == 1;
};

export const useIsOther = () => {
  return useSelector((state: RootState) => state.app.auth?.role) == 2;
};

export const useUserName = () => {
  return useSelector((state: RootState) => state.app.auth?.name);
};

export const useError = () => {
  return useSelector((state: RootState) => state.app.error);
};

export const useConfig = () => {
  return useSelector((state: RootState) => state.app.config);
};

export const useCurrencies = () => {
  return useSelector((state: RootState) => state.app.config?.currencies);
};

export const useCods = () => {
  return useSelector((state: RootState) => state.app.config?.cods);
};

export const useInitCustomer = () => {
  return useSelector((state: RootState) => state.app.initCustomer);
};
