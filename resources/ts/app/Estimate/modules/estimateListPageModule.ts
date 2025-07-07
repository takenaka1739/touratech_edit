import { actionCreatorFactory } from 'typescript-fsa';
import { reducerWithInitialState } from 'typescript-fsa-reducers';
import { addMonths, format, startOfMonth } from 'date-fns';

const c_estimate_date_from = format(startOfMonth(addMonths(new Date(), -1)), 'yyyy/MM/dd');

const create = actionCreatorFactory();

export type EstimateListPageConditionState = {
  c_estimate_date_from?: string | undefined;
  c_estimate_date_to?: string | undefined;
  c_customer_name?: string | undefined;
  c_user_name?: string | undefined;
  c_item_number?: string | undefined;
  c_name?: string | undefined;
  c_order_no?: string | undefined;
  c_not_receive_order?: boolean | undefined;
  page: number;
};

export type EstimateListPageState = {
  conditions: EstimateListPageConditionState;
};

export const estimateInitialState: EstimateListPageState = {
  conditions: {
    c_estimate_date_from: c_estimate_date_from,
    c_estimate_date_to: '',
    c_customer_name: '',
    c_user_name: '',
    c_item_number: '',
    c_name: '',
    c_order_no: '',
    c_not_receive_order: false,
    page: 1,
  },
};

export const EstimateListPageActions = {
  setConditions: create<EstimateListPageConditionState>('ESTIMATE_LIST_PAGE_SET_CONDITIONS'),
};

export const EstimateListPageReducer = reducerWithInitialState(estimateInitialState).case(
  EstimateListPageActions.setConditions,
  (state, conditions) => {
    return { ...state, conditions };
  }
);
