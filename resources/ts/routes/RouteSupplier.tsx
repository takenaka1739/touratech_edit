import { Switch, Route } from 'react-router-dom';
import { AdminRoute } from '@/components';
import { SupplierListPage } from '@/app/Supplier/pages/SupplierListPage';
import { SupplierDetailPage } from '@/app/Supplier/pages/SupplierDetailPage';
import { NotFound } from '@/app/App/pages/NotFound';

const RouteSupplier: React.VFC = () => (
  <Switch>
    <AdminRoute exact path="/supplier" component={SupplierListPage} />
    <AdminRoute exact path="/supplier/detail/:id(\d*)?" component={SupplierDetailPage} />
    <Route component={NotFound} />
  </Switch>
);

export default RouteSupplier;
