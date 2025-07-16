import { Switch, Route } from 'react-router-dom';
import CouponListPage from '@/app/Coupon/pages/CouponListPage';
import { CouponDetailPage } from '@/app/Coupon/pages/CouponDetailPage';
import { NotFound } from '@/app/App/pages/NotFound';

const RouteCoupon: React.VFC = () => {
  return (
    <Switch>
      <Route exact path="/coupon" component={CouponListPage} />
      <Route path="/coupon/detail/:id(new|\d+)" component={CouponDetailPage} />
      <Route path="/coupon/:id" component={CouponDetailPage} />
      <Route component={NotFound} />
    </Switch>
  );
};

export default RouteCoupon;
