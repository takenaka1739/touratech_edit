import { actionCreatorFactory } from 'typescript-fsa';
import { reducerWithInitialState } from 'typescript-fsa-reducers';

const create = actionCreatorFactory();

export type ItemListPageConditionState = {
  c_keyword?: string;
  c_is_display: string;
  c_has_discontinued: boolean;
  c_is_set_item?: boolean;
  c_supplier_id?: number | undefined;
  c_supplier_name?: string | undefined;
  c_un_supplier?: boolean;
  page: number;
};

export type ItemListPageState = {
  conditions: ItemListPageConditionState;
};

export const itemInitialState: ItemListPageState = {
  conditions: {
    c_keyword: '',
    c_is_display: 'none',
    c_has_discontinued: false,
    c_is_set_item: false,
    c_supplier_id: undefined,
    c_supplier_name: undefined,
    c_un_supplier: false,
    page: 1,
  },
};

export const ItemListPageActions = {
  setConditions: create<ItemListPageConditionState>('ITEM_LIST_PAGE_SET_CONDITIONS'),
};

export const ItemListPageReducer = reducerWithInitialState(itemInitialState).case(
  ItemListPageActions.setConditions,
  (state, conditions) => {
    return { ...state, conditions };
  }
);
