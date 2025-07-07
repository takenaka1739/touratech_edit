import { actionCreatorFactory } from 'typescript-fsa';
import { reducerWithInitialState } from 'typescript-fsa-reducers';
import { addMonths, format, startOfMonth } from 'date-fns';

const c_sales_date_from = format(startOfMonth(addMonths(new Date(), -1)), 'yyyy/MM/dd');

const create = actionCreatorFactory();

export type SalesListPageConditionState = {
  c_sales_date_from?: string;
  c_sales_date_to?: string;
  c_customer_name?: string | undefined;
  c_user_name?: string | undefined;
  c_item_number?: string | undefined;
  c_name?: string | undefined;
  c_order_no?: string | undefined;
  page: number;
};

export type SalesListPageState = {
  conditions: SalesListPageConditionState;
};

export const salesInitialState: SalesListPageState = {
  conditions: {
    c_sales_date_from: c_sales_date_from,
    c_sales_date_to: '',
    c_customer_name: '',
    c_user_name: '',
    c_item_number: '',
    c_name: '',
    c_order_no: '',
    page: 1,
  },
};

export const SalesListPageActions = {
  setConditions: create<SalesListPageConditionState>('SALES_LIST_PAGE_SET_CONDITIONS'),
};

export const SalesListPageReducer = reducerWithInitialState(salesInitialState).case(
  SalesListPageActions.setConditions,
  (state, conditions) => {
    return { ...state, conditions };
  }
);
