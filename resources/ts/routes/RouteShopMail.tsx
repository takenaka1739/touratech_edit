import { Switch, Route } from 'react-router-dom';
import { AdminRoute } from '@/components';
import { ShopMailPage } from '@/app/ShopMail/pages/ShopMailPage';
import { InquiryReplyListPage } from '@/app/ShopMail/pages/InquiryReplyListPage';
import { NotFound } from '@/app/App/pages/NotFound';

const RouteShopMail: React.VFC = () => (
  <Switch>
    <AdminRoute exact path="/shop_mail" component={ShopMailPage} />
    <AdminRoute exact path="/inquiry_mail" component={InquiryReplyListPage} />
    <Route component={NotFound} />
  </Switch>
);

export default RouteShopMail;
