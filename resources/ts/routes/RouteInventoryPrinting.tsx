import { Switch, Route } from 'react-router-dom';
import { InventoryPrintingDetailPage } from '@/app/InventoryPrinting/pages/InventoryPrintingDetailPage';
import { NotFound } from '@/app/App/pages/NotFound';

const RouteInventoryPrinting: React.VFC = () => (
  <Switch>
    <Route exact path="/inventory_printing" component={InventoryPrintingDetailPage} />
    <Route component={NotFound} />
  </Switch>
);

export default RouteInventoryPrinting;
