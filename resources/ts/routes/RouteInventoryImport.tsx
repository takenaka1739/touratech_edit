import { Switch, Route } from 'react-router-dom';
import { InventoryImportDetailPage } from '@/app/InventoryImport/pages/InventoryImportDetailPage';
import { NotFound } from '@/app/App/pages/NotFound';

const RouteInventoryImport: React.VFC = () => (
  <Switch>
    <Route exact path="/inventory_import" component={InventoryImportDetailPage} />
    <Route component={NotFound} />
  </Switch>
);

export default RouteInventoryImport;
