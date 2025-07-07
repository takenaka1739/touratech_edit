import { Switch, Route } from 'react-router-dom';
import { AdminRoute } from '@/components';
import { ConfigDetailPage } from '@/app/Config/pages/ConfigDetailPage';
import { NotFound } from '@/app/App/pages/NotFound';

const RouteConfig: React.VFC = () => (
  <Switch>
    <AdminRoute exact path="/config" component={ConfigDetailPage} />
    <Route component={NotFound} />
  </Switch>
);

export default RouteConfig;
