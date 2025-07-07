import { actionCreatorFactory } from 'typescript-fsa';
import { reducerWithInitialState } from 'typescript-fsa-reducers';

const create = actionCreatorFactory();

export type UserListPageConditionState = {
  c_keyword?: string;
  c_role?: string;
  page: number;
};

export type UserListPageState = {
  conditions: UserListPageConditionState;
};

export const userListPageInitialState: UserListPageState = {
  conditions: {
    c_keyword: '',
    c_role: 'none',
    page: 1,
  },
};

export const UserListPageActions = {
  setConditions: create<UserListPageConditionState>('USER_LIST_PAGE_SET_CONDITIONS'),
};

export const UserListPageReducer = reducerWithInitialState(userListPageInitialState).case(
  UserListPageActions.setConditions,
  (state, conditions) => {
    return { ...state, conditions };
  }
);
