import { actionCreatorFactory } from 'typescript-fsa';
import { reducerWithInitialState } from 'typescript-fsa-reducers';

const create = actionCreatorFactory();

export type SetItemListPageConditionState = {
  c_keyword?: string;
  c_is_display: string;
  c_has_discontinued: boolean;
  c_is_set_item?: boolean;
  page: number;
};

export type SetItemListPageState = {
  conditions: SetItemListPageConditionState;
};

export const setItemInitialState: SetItemListPageState = {
  conditions: {
    c_keyword: '',
    c_is_display: 'none',
    c_has_discontinued: false,
    c_is_set_item: true,
    page: 1,
  },
};

export const SetItemListPageActions = {
  setConditions: create<SetItemListPageConditionState>('SET_ITEM_LIST_PAGE_SET_CONDITIONS'),
};

export const SetItemListPageReducer = reducerWithInitialState(setItemInitialState).case(
  SetItemListPageActions.setConditions,
  (state, conditions) => {
    return { ...state, conditions };
  }
);
