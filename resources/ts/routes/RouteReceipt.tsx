import { Switch, Route } from 'react-router-dom';
import { ReceiptListPage } from '@/app/Receipt/pages/ReceiptListPage';
import { ReceiptDetailPage } from '@/app/Receipt/pages/ReceiptDetailPage';
import { NotFound } from '@/app/App/pages/NotFound';

const RouteReceipt: React.VFC = () => (
  <Switch>
    <Route exact path="/receipt" component={ReceiptListPage} />
    <Route exact path="/receipt/detail/:id(\d*)?" component={ReceiptDetailPage} />
    <Route component={NotFound} />
  </Switch>
);

export default RouteReceipt;
