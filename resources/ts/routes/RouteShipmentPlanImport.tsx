import { Switch, Route } from 'react-router-dom';
import { ShipmentPlanImportDetailPage } from '@/app/ShipmentPlanImport/pages/ShipmentPlanImportDetailPage';
import { NotFound } from '@/app/App/pages/NotFound';

const RouteShipmentPlanImport: React.VFC = () => (
  <Switch>
    <Route exact path="/shipment_plan_import" component={ShipmentPlanImportDetailPage} />
    <Route component={NotFound} />
  </Switch>
);

export default RouteShipmentPlanImport;
