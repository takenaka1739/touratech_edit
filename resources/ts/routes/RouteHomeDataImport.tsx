import { Switch, Route } from 'react-router-dom';
import { HomeDataImportDetailPage } from '@/app/HomeDataImport/pages/HomeDataImportDetailPage';
import { NotFound } from '@/app/App/pages/NotFound';

const RouteHomeDataImport: React.VFC = () => (
  <Switch>
    <Route exact path="/home_data_import" component={HomeDataImportDetailPage} />
    <Route component={NotFound} />
  </Switch>
);

export default RouteHomeDataImport;
