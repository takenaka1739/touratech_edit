import { actionCreatorFactory } from 'typescript-fsa';
import { reducerWithInitialState } from 'typescript-fsa-reducers';

const create = actionCreatorFactory();

export type ShipmentPlanListPageConditionState = {
  c_shipment_plan_date_from?: string;
  c_shipment_plan_date_to?: string;
  c_item_number?: string | undefined;
  page: number;
};

export type ShipmentPlanListPageState = {
  conditions: ShipmentPlanListPageConditionState;
};

export const shipmentPlanInitialState: ShipmentPlanListPageState = {
  conditions: {
    c_shipment_plan_date_from: '',
    c_shipment_plan_date_to: '',
    c_item_number: '',
    page: 1,
  },
};

export const ShipmentPlanListPageActions = {
  setConditions: create<ShipmentPlanListPageConditionState>(
    'SHIPMENT_PLAN_LIST_PAGE_SET_CONDITIONS'
  ),
};

export const ShipmentPlanListPageReducer = reducerWithInitialState(shipmentPlanInitialState).case(
  ShipmentPlanListPageActions.setConditions,
  (state, conditions) => {
    return { ...state, conditions };
  }
);
