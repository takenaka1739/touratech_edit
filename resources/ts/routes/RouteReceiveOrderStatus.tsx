import { Switch, Route } from 'react-router-dom';
import { ReceiveOrderStatusListPage } from '@/app/ReceiveOrderStatus/pages/ReceiveOrderStatusListPage';
import { NotFound } from '@/app/App/pages/NotFound';

const RouteReceiveOrder: React.VFC = () => (
  <Switch>
    <Route exact path="/receive_order_status" component={ReceiveOrderStatusListPage} />
    <Route component={NotFound} />
  </Switch>
);

export default RouteReceiveOrder;
