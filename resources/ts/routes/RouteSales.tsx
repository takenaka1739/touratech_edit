import { Switch, Route } from 'react-router-dom';
import { SalesListPage } from '@/app/Sales/pages/SalesListPage';
import { SalesDetailPage } from '@/app/Sales/pages/SalesDetailPage';
import { NotFound } from '@/app/App/pages/NotFound';

const RouteSales: React.VFC = () => (
  <Switch>
    <Route exact path="/sales" component={SalesListPage} />
    <Route
      exact
      path="/sales/detail_by_receive_id/:id(\d*)"
      render={props => <SalesDetailPage from_receive={true} {...props} />}
    />
    <Route
      exact
      path="/sales/detail/:id(\d*)?"
      render={props => <SalesDetailPage from_receive={false} {...props} />}
    />
    <Route component={NotFound} />
  </Switch>
);

export default RouteSales;
