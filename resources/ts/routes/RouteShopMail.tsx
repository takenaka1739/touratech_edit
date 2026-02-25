import { Switch, Route } from 'react-router-dom';
import { AdminRoute } from '@/components';
import { ShopMailPage } from '@/app/ShopMail/pages/ShopMailPage';
import { InquiryReplyListPage } from '@/app/ShopMail/pages/InquiryReplyListPage';
import { InquiryReplyDetailPage } from '@/app/ShopMail/pages/InquiryReplyDetailPage';
import { NotFound } from '@/app/App/pages/NotFound';

const RouteShopMail: React.VFC = () => (
  <Switch>
    <AdminRoute exact path="/shop_mail" component={ShopMailPage} />
    <AdminRoute exact path="/inquiry_mail" component={InquiryReplyListPage} />
    <AdminRoute exact path="/inquiry_mail/detail/:id(\d*)?" component={InquiryReplyDetailPage} />
    <Route component={NotFound} />
  </Switch>
);

export default RouteShopMail;
