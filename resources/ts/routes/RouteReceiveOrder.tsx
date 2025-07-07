import { Switch, Route } from 'react-router-dom';
import { ReceiveOrderListPage } from '@/app/ReceiveOrder/pages/ReceiveOrderListPage';
import { ReceiveOrderDetailPage } from '@/app/ReceiveOrder/pages/ReceiveOrderDetailPage';
import { NotFound } from '@/app/App/pages/NotFound';

const RouteReceiveOrder: React.VFC = () => (
  <Switch>
    <Route exact path="/receive_order" component={ReceiveOrderListPage} />
    <Route exact path="/receive_order/detail/:id(\d*)?" component={ReceiveOrderDetailPage} />
    <Route component={NotFound} />
  </Switch>
);

export default RouteReceiveOrder;
