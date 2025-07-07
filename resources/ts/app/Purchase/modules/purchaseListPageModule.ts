import { actionCreatorFactory } from 'typescript-fsa';
import { reducerWithInitialState } from 'typescript-fsa-reducers';
import { addMonths, format, startOfMonth } from 'date-fns';

const c_purchase_date_from = format(startOfMonth(addMonths(new Date(), -1)), 'yyyy/MM/dd');

const create = actionCreatorFactory();

export type PurchaseListPageConditionState = {
  c_purchase_date_from?: string;
  c_purchase_date_to?: string;
  c_user_name?: string | undefined;
  c_item_number?: string | undefined;
  c_name?: string | undefined;
  page: number;
};

export type PurchaseListPageState = {
  conditions: PurchaseListPageConditionState;
};

export const purchaseInitialState: PurchaseListPageState = {
  conditions: {
    c_purchase_date_from: c_purchase_date_from,
    c_purchase_date_to: '',
    c_user_name: '',
    c_item_number: '',
    c_name: '',
    page: 1,
  },
};

export const PurchaseListPageActions = {
  setConditions: create<PurchaseListPageConditionState>('PURCHASE_LIST_PAGE_SET_CONDITIONS'),
};

export const PurchaseListPageReducer = reducerWithInitialState(purchaseInitialState).case(
  PurchaseListPageActions.setConditions,
  (state, conditions) => {
    return { ...state, conditions };
  }
);
