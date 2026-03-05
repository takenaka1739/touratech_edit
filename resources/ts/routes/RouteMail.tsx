import { Switch, Route } from 'react-router-dom';
import { AdminRoute } from '@/components';
import { MailListPage } from '@/app/Mail/pages/MailListPage';
import { MailDetailPage } from '@/app/Mail/pages/MailDetailPage';
import { NotFound } from '@/app/App/pages/NotFound';

const RouteShopMail: React.VFC = () => (
  <Switch>
    <AdminRoute exact path="/mail" component={MailListPage} />
    <AdminRoute exact path="/mail/detail/:id(\d*)?" component={MailDetailPage} />
    <AdminRoute exact path="/mail/detail" component={MailDetailPage} />
    <Route component={NotFound} />
  </Switch>
);

export default RouteShopMail;
