import { Switch, Route } from 'react-router-dom';
import { ShipmentPlanListPage } from '@/app/ShipmentPlan/pages/ShipmentPlanListPage';
import { NotFound } from '@/app/App/pages/NotFound';

const RouteShipmentPlan: React.VFC = () => (
  <Switch>
    <Route exact path="/shipment_plan" component={ShipmentPlanListPage} />
    <Route component={NotFound} />
  </Switch>
);

export default RouteShipmentPlan;
