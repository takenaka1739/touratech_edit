import { Switch, Route } from 'react-router-dom';
import { HidenDetailPage } from '@/app/Hiden/pages/HidenDetailPage';
import { NotFound } from '@/app/App/pages/NotFound';

const RouteConfig: React.VFC = () => (
  <Switch>
    <Route exact path="/hiden" component={HidenDetailPage} />
    <Route component={NotFound} />
  </Switch>
);

export default RouteConfig;
