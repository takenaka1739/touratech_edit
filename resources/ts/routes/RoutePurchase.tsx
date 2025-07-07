import { Switch, Route } from 'react-router-dom';
import { PurchaseListPage } from '@/app/Purchase/pages/PurchaseListPage';
import { PurchaseDetailPage } from '@/app/Purchase/pages/PurchaseDetailPage';
import { NotFound } from '@/app/App/pages/NotFound';

const RoutePurchase: React.VFC = () => (
  <Switch>
    <Route exact path="/purchase" component={PurchaseListPage} />
    <Route exact path="/purchase/detail/:id(\d*)?" component={PurchaseDetailPage} />
    <Route component={NotFound} />
  </Switch>
);

export default RoutePurchase;
