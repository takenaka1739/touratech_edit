import { Switch, Route } from 'react-router-dom';
import { AdminRoute } from '@/components';
import { SetItemListPage } from '@/app/SetItem/pages/SetItemListPage';
import { SetItemDetailPage } from '@/app/SetItem/pages/SetItemDetailPage';
import { NotFound } from '@/app/App/pages/NotFound';

const RouteSetItem: React.VFC = () => (
  <Switch>
    <AdminRoute exact path="/set_item" component={SetItemListPage} />
    <AdminRoute exact path="/set_item/detail/:id(\d*)?" component={SetItemDetailPage} />
    <Route component={NotFound} />
  </Switch>
);

export default RouteSetItem;
