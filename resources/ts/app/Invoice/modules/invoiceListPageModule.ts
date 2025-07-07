import { actionCreatorFactory } from 'typescript-fsa';
import { reducerWithInitialState } from 'typescript-fsa-reducers';

import { addMonths, format, startOfMonth } from 'date-fns';

const c_invoice_month = format(startOfMonth(addMonths(new Date(), -1)), 'yyyy/MM');

const create = actionCreatorFactory();

export type InvoiceListPageConditionState = {
  c_invoice_month?: string;
  c_cutoff_date?: number | undefined;
  page: number;
};

export type InvoiceListPageState = {
  conditions: InvoiceListPageConditionState;
};

export const invoiceInitialState: InvoiceListPageState = {
  conditions: {
    c_invoice_month: c_invoice_month,
    c_cutoff_date: undefined,
    page: 1,
  },
};

export const InvoiceListPageActions = {
  setConditions: create<InvoiceListPageConditionState>('INVOICE_LIST_PAGE_SET_CONDITIONS'),
};

export const InvoiceListPageReducer = reducerWithInitialState(invoiceInitialState).case(
  InvoiceListPageActions.setConditions,
  (state, conditions) => {
    return { ...state, conditions };
  }
);
