import { Switch, Route } from 'react-router-dom';
import { PlaceOrderExportDetailPage } from '@/app/PlaceOrderExport/pages/PlaceOrderExportDetailPage';
import { NotFound } from '@/app/App/pages/NotFound';

const RouteConfig: React.VFC = () => (
  <Switch>
    <Route exact path="/place_order_export" component={PlaceOrderExportDetailPage} />
    <Route component={NotFound} />
  </Switch>
);

export default RouteConfig;
