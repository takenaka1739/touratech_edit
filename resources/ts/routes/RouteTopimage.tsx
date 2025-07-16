import { Route } from 'react-router-dom';
import TopImageListPage from '../app/TopImage/pages/TopImageListPage';

const RouteTopimage = () => {
  return (
    <>
      <Route path="/TopImage" component={TopImageListPage} />
    </>
  );
};

export default RouteTopimage;
