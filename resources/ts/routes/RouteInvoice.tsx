import { Switch, Route } from 'react-router-dom';
import { InvoiceListPage } from '@/app/Invoice/pages/InvoiceListPage';
import { NotFound } from '@/app/App/pages/NotFound';

const RouteInvoice: React.VFC = () => (
  <Switch>
    <Route exact path="/invoice" component={InvoiceListPage} />
    <Route component={NotFound} />
  </Switch>
);

export default RouteInvoice;
