import { Switch, Route } from 'react-router-dom';
import { AdminRoute } from '@/components';
import { ItemListPage } from '@/app/Item/pages/ItemListPage';
import { ItemDetailPage } from '@/app/Item/pages/ItemDetailPage';
import { NotFound } from '@/app/App/pages/NotFound';

const RouteItem: React.VFC = () => (
  <Switch>
    <AdminRoute exact path="/item" component={ItemListPage} />
    <AdminRoute exact path="/item/detail/:id(\d*)?" component={ItemDetailPage} />
    <Route component={NotFound} />
  </Switch>
);

export default RouteItem;
