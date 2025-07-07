import { Switch, Route } from 'react-router-dom';
import { AdminRoute } from '@/components';
import { UserListPage } from '@/app/User/pages/UserListPage';
import { UserDetailPage } from '@/app/User/pages/UserDetailPage';
import { NotFound } from '@/app/App/pages/NotFound';

const RouteUser: React.VFC = () => (
  <Switch>
    <AdminRoute exact path="/user" component={UserListPage} />
    <AdminRoute exact path="/user/detail/:id(\d*)?" component={UserDetailPage} />
    <Route component={NotFound} />
  </Switch>
);

export default RouteUser;
