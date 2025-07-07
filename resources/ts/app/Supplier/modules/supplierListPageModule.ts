import { actionCreatorFactory } from 'typescript-fsa';
import { reducerWithInitialState } from 'typescript-fsa-reducers';

const create = actionCreatorFactory();

export type SupplierListPageConditionState = {
  c_keyword?: string;
  page: number;
};

export type SupplierListPageState = {
  conditions: SupplierListPageConditionState;
};

export const supplierInitialState: SupplierListPageState = {
  conditions: {
    c_keyword: '',
    page: 1,
  },
};

export const SupplierListPageActions = {
  setConditions: create<SupplierListPageConditionState>('SUPPLIER_LIST_PAGE_SET_CONDITIONS'),
};

export const SupplierListPageReducer = reducerWithInitialState(supplierInitialState).case(
  SupplierListPageActions.setConditions,
  (state, conditions) => {
    return { ...state, conditions };
  }
);
