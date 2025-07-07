import { actionCreatorFactory } from 'typescript-fsa';
import { reducerWithInitialState } from 'typescript-fsa-reducers';
import { addMonths, format, startOfMonth } from 'date-fns';

const c_receive_order_date_from = format(startOfMonth(addMonths(new Date(), -1)), 'yyyy/MM/dd');

const create = actionCreatorFactory();

export type ReceiveOrderListPageConditionState = {
  c_receive_order_date_from?: string;
  c_receive_order_date_to?: string;
  c_customer_name?: string | undefined;
  c_user_name?: string | undefined;
  c_item_number?: string | undefined;
  c_name?: string | undefined;
  c_order_no?: string | undefined;
  page: number;
};

export type ReceiveOrderListPageState = {
  conditions: ReceiveOrderListPageConditionState;
};

export const receiveOrderInitialState: ReceiveOrderListPageState = {
  conditions: {
    c_receive_order_date_from: c_receive_order_date_from,
    c_receive_order_date_to: '',
    c_customer_name: '',
    c_user_name: '',
    c_item_number: '',
    c_name: '',
    c_order_no: '',
    page: 1,
  },
};

export const ReceiveOrderListPageActions = {
  setConditions: create<ReceiveOrderListPageConditionState>(
    'RECEIVE_ORDER_LIST_PAGE_SET_CONDITIONS'
  ),
};

export const ReceiveOrderListPageReducer = reducerWithInitialState(receiveOrderInitialState).case(
  ReceiveOrderListPageActions.setConditions,
  (state, conditions) => {
    return { ...state, conditions };
  }
);
