import { actionCreatorFactory } from 'typescript-fsa';
import { reducerWithInitialState } from 'typescript-fsa-reducers';

const create = actionCreatorFactory();

export type ItemClassificationListPageConditionState = {
  c_keyword?: string;
  page: number;
};

export type ItemClassificationListPageState = {
  conditions: ItemClassificationListPageConditionState;
};

export const itemClassificationInitialState: ItemClassificationListPageState = {
  conditions: {
    c_keyword: '',
    page: 1,
  },
};

export const ItemClassificationListPageActions = {
  setConditions: create<ItemClassificationListPageConditionState>(
    'ITEM_CLASSIFICATION_LIST_PAGE_SET_CONDITIONS'
  ),
};

export const ItemClassificationListPageReducer = reducerWithInitialState(
  itemClassificationInitialState
).case(ItemClassificationListPageActions.setConditions, (state, conditions) => {
  return { ...state, conditions };
});
