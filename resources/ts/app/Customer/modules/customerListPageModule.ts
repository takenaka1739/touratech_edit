import { actionCreatorFactory } from 'typescript-fsa';
import { reducerWithInitialState } from 'typescript-fsa-reducers';

const create = actionCreatorFactory();

export type CustomerListPageConditionState = {
  c_keyword?: string;
  page: number;
};

export type CustomerListPageState = {
  conditions: CustomerListPageConditionState;
};

export const customerInitialState: CustomerListPageState = {
  conditions: {
    c_keyword: '',
    page: 1,
  },
};

export const CustomerListPageActions = {
  setConditions: create<CustomerListPageConditionState>('CUSTOMER_LIST_PAGE_SET_CONDITIONS'),
};

export const CustomerListPageReducer = reducerWithInitialState(customerInitialState).case(
  CustomerListPageActions.setConditions,
  (state, conditions) => {
    return { ...state, conditions };
  }
);
