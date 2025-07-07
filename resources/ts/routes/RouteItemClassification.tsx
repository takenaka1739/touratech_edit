import { Switch, Route } from 'react-router-dom';
import { AdminRoute } from '@/components';
import { ItemClassificationListPage } from '@/app/ItemClassification/pages/ItemClassificationListPage';
import { ItemClassificationDetailPage } from '@/app/ItemClassification/pages/ItemClassificationDetailPage';
import { NotFound } from '@/app/App/pages/NotFound';

const RouteItemClassification: React.VFC = () => (
  <Switch>
    <AdminRoute exact path="/item_classification" component={ItemClassificationListPage} />
    <AdminRoute
      exact
      path="/item_classification/detail/:id(\d*)?"
      component={ItemClassificationDetailPage}
    />
    <Route component={NotFound} />
  </Switch>
);

export default RouteItemClassification;
