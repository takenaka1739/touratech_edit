import { actionCreatorFactory } from 'typescript-fsa';
import { reducerWithInitialState } from 'typescript-fsa-reducers';
import { addMonths, format, startOfMonth } from 'date-fns';

const c_place_order_date_from = format(startOfMonth(addMonths(new Date(), -1)), 'yyyy/MM/dd');

const create = actionCreatorFactory();

export type PlaceOrderListPageConditionState = {
  c_place_order_date_from?: string;
  c_place_order_date_to?: string;
  c_user_name?: string | undefined;
  c_item_number?: string | undefined;
  c_name?: string | undefined;
  c_is_purchased: string;
  page: number;
};

export type PlaceOrderListPageState = {
  conditions: PlaceOrderListPageConditionState;
};

export const placeOrderInitialState: PlaceOrderListPageState = {
  conditions: {
    c_place_order_date_from: c_place_order_date_from,
    c_place_order_date_to: '',
    c_user_name: '',
    c_item_number: '',
    c_name: '',
    c_is_purchased: 'none',
    page: 1,
  },
};

export const PlaceOrderListPageActions = {
  setConditions: create<PlaceOrderListPageConditionState>('PLACE_ORDER_LIST_PAGE_SET_CONDITIONS'),
};

export const PlaceOrderListPageReducer = reducerWithInitialState(placeOrderInitialState).case(
  PlaceOrderListPageActions.setConditions,
  (state, conditions) => {
    return { ...state, conditions };
  }
);
