import { actionCreatorFactory } from 'typescript-fsa';
import { reducerWithInitialState } from 'typescript-fsa-reducers';

const create = actionCreatorFactory();

export type ReceiptListPageConditionState = {
  c_receipt_date_from?: string;
  c_receipt_date_to?: string;
  c_customer_name?: string | undefined;
  c_user_name?: string | undefined;
  page: number;
};

export type ReceiptListPageState = {
  conditions: ReceiptListPageConditionState;
};

export const receiptInitialState: ReceiptListPageState = {
  conditions: {
    c_receipt_date_from: '',
    c_receipt_date_to: '',
    c_customer_name: '',
    c_user_name: '',
    page: 1,
  },
};

export const ReceiptListPageActions = {
  setConditions: create<ReceiptListPageConditionState>('RECEIPT_LIST_PAGE_SET_CONDITIONS'),
};

export const ReceiptListPageReducer = reducerWithInitialState(receiptInitialState).case(
  ReceiptListPageActions.setConditions,
  (state, conditions) => {
    return { ...state, conditions };
  }
);
