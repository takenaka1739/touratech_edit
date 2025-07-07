import { Switch, Route } from 'react-router-dom';
import { EstimateListPage } from '@/app/Estimate/pages/EstimateListPage';
import { EstimateDetailPage } from '@/app/Estimate/pages/EstimateDetailPage';
import { NotFound } from '@/app/App/pages/NotFound';

const RouteEstimate: React.VFC = () => (
  <Switch>
    <Route exact path="/estimate" component={EstimateListPage} />
    <Route exact path="/estimate/detail/:id(\d*)?" component={EstimateDetailPage} />
    <Route component={NotFound} />
  </Switch>
);

export default RouteEstimate;
