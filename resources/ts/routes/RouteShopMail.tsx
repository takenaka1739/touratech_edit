import { Switch, Route } from 'react-router-dom';
import { AdminRoute } from '@/components';
import { ShopMailListPage } from '@/app/ShopMail/pages/ShopMailListPage';
import { ShopMailDetailPage } from '@/app/ShopMail/pages/ShopMailDetailPage';
import { InquiryReplyListPage } from '@/app/ShopMail/pages/InquiryReplyListPage';
import { ReplyListPage } from '@/app/ShopMail/pages/ReplyListPage';
import { ReceiveOrderDetailPage } from '@/app/ShopMail/pages/ReceiveOrderDetailPage';
import { SalesDetailPage } from '@/app/ShopMail/pages/SalesDetailPage';
import { ReplyDetailPage } from '@/app/ShopMail/pages/ReplyDetailPage';
import { NotFound } from '@/app/App/pages/NotFound';

const RouteShopMail: React.VFC = () => (
  <Switch>
    <AdminRoute exact path="/shop_mail_list" component={ShopMailListPage} />
    {/*<AdminRoute exact path="/shop_mail/:id(\d*)?" component={ShopMailDetailPage} />*/}
    <AdminRoute exact path="/shop_mail_list/detail" component={ShopMailDetailPage} />
    <AdminRoute exact path="/shop_mail_list/detail/:id(\d*)?" component={ShopMailDetailPage} />
    <AdminRoute exact path="/inquiry_mail" component={InquiryReplyListPage} />
    <AdminRoute exact path="/inquiry_mail/reply_list/:id(\d*)?" component={ReplyListPage} />
    <AdminRoute exact path="/inquiry_mail/receive_order/:id(\d*)?" component={ReceiveOrderDetailPage} />
    <AdminRoute exact path="/inquiry_mail/sales/:id(\d*)?" component={SalesDetailPage} />
    <AdminRoute exact path="/inquiry_mail/reply/detail/:id(\d*)?" component={ReplyDetailPage} />
    <Route component={NotFound} />
  </Switch>
);

export default RouteShopMail;
