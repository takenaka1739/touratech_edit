import { actionCreatorFactory } from 'typescript-fsa';
import { reducerWithInitialState } from 'typescript-fsa-reducers';

const create = actionCreatorFactory();

export type CalendarListPageConditionState = {
  c_keyword?: string;
  page: number;
};

export type CalendarListPageState = {
  conditions: CalendarListPageConditionState;
};

export const calendarInitialState: CalendarListPageState = {
  conditions: {
    c_keyword: '',
    page: 1,
  },
};

export const CalendarListPageActions = {
  setConditions: create<CalendarListPageConditionState>('CALENDAR_LIST_PAGE_SET_CONDITIONS'),
};

export const CalendarListPageReducer = reducerWithInitialState(calendarInitialState).case(
  CalendarListPageActions.setConditions,
  (state, conditions) => {
    return { ...state, conditions };
  }
);
