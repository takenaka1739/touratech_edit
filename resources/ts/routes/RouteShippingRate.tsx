import { Switch, Route } from 'react-router-dom';
import { AdminRoute } from '@/components';
import { NotFound } from '@/app/App/pages/NotFound';
import { ShippingRatePage } from '@/app/ShippingRate/pages/ShippingRatePage';

const RouteShippingRate: React.VFC = () => (
  <Switch>
    <AdminRoute exact path="/shipping_rate" component={ShippingRatePage} />
    <Route component={NotFound} />
  </Switch>
);

export default RouteShippingRate;
