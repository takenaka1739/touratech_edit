import { Switch, Route } from 'react-router-dom';
import { PlaceOrderListPage } from '@/app/PlaceOrder/pages/PlaceOrderListPage';
import { PlaceOrderDetailPage } from '@/app/PlaceOrder/pages/PlaceOrderDetailPage';
import { NotFound } from '@/app/App/pages/NotFound';

const RoutePlaceOrder: React.VFC = () => (
  <Switch>
    <Route exact path="/place_order" component={PlaceOrderListPage} />
    <Route
      exact
      path="/place_order/detail_by_receive_id/:id(\d*)"
      render={props => <PlaceOrderDetailPage from_receive={true} {...props} />}
    />
    <Route
      exact
      path="/place_order/detail/:id(\d*)?"
      render={props => <PlaceOrderDetailPage from_receive={false} {...props} />}
    />
    <Route component={NotFound} />
  </Switch>
);

export default RoutePlaceOrder;
