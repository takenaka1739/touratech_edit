import { actionCreatorFactory } from 'typescript-fsa';
import { asyncFactory } from 'typescript-fsa-redux-thunk';
import { reducerWithInitialState } from 'typescript-fsa-reducers';
import axios from 'axios';
import toNumber from 'lodash/toNumber';
import { RootState } from '@/store';
import { App, Config } from '@/types';

const create = actionCreatorFactory();
const createAsync = asyncFactory<RootState>(create);

export type AppState = App & {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
};

export const appInitialState: AppState = {
  isInitialized: false,
  isLoading: false,
  auth: undefined,
  config: undefined,
  initCustomer: undefined,
  error: null,
};

export const AppActions = {
  request: create('APP_REQUEST'),
  success: create('APP_SUCCESS'),
  failed: create<string>('APP_FAILED'),
  clearError: create('APP_CLEAR_ERROR'),
  setConfig: create<Config>('APP_SET_CONFIG'),
};

const toState: (data: AppState) => AppState = data => {
  const { config, ...props } = data;

  if (config == undefined) {
    return data;
  }

  const _cods = config.cods.map(x => {
    return { ...x, border: toNumber(x.border), amount: toNumber(x.amount) };
  });
  return {
    ...props,
    config: { ...config, cods: _cods },
  };
};

export const initialize = createAsync<{}, AppState, Error>('APP_INIT', async ({}, dispatch) => {
  const res = await axios.get('/api/app').catch(error => error.response);

  if (res.status === 200) {
    return toState(res.data.data);
  } else {
    dispatch(AppActions.failed('初期化に失敗しました。'));
    throw new Error('初期化に失敗しました。');
  }
});

export const AppReducer = reducerWithInitialState(appInitialState)
  .case(AppActions.request, state => {
    return { ...state, isLoading: true };
  })
  .case(AppActions.success, state => {
    return { ...state, isLoading: false };
  })
  .case(AppActions.failed, (state, error) => {
    return { ...state, isLoading: false, error };
  })
  .case(AppActions.clearError, state => {
    return { ...state, error: null };
  })
  .case(AppActions.setConfig, (state, config) => {
    return { ...state, config: { ...state.config, ...config } };
  })
  .case(initialize.async.done, (state, payload) => {
    return { ...state, ...payload.result, isInitialized: true };
  });
