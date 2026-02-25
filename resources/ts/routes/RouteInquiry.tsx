import { Switch, Route } from 'react-router-dom';
import { AdminRoute } from '@/components';
//import { ShopMailListPage } from '@/app/Inquiry/pages/ShopMailListPage';
//import { ShopMailDetailPage } from '@/app/Inquiry/pages/ShopMailDetailPage';
import { InquiryReplyListPage } from '@/app/Inquiry/pages/InquiryReplyListPage';
import { ReplyListPage } from '@/app/Inquiry/pages/ReplyListPage';
//import { ReceiveOrderDetailPage } from '@/app/Inquiry/pages/ReceiveOrderDetailPage';
//import { SalesDetailPage } from '@/app/Inquiry/pages/SalesDetailPage';
import { ReplyDetailPage } from '@/app/Inquiry/pages/ReplyDetailPage';
import { NotFound } from '@/app/App/pages/NotFound';

const RouteShopMail: React.VFC = () => (
  <Switch>
    {/*<AdminRoute exact path="/shop_mail_list" component={ShopMailListPage} />*/}
    {/*<AdminRoute exact path="/shop_mail/:id(\d*)?" component={ShopMailDetailPage} />*/}
    {/*<AdminRoute exact path="/shop_mail_list/detail" component={ShopMailDetailPage} />*/}
    {/*<AdminRoute exact path="/shop_mail_list/detail/:id(\d*)?" component={ShopMailDetailPage} />*/}
    <AdminRoute exact path="/inquiry" component={InquiryReplyListPage} />
    <AdminRoute exact path="/inquiry/reply/:id(\d*)?" component={ReplyListPage} />
    {/*<AdminRoute exact path="/inquiry_mail/receive_order/:id(\d*)?" component={ReceiveOrderDetailPage} />*/}
    {/*<AdminRoute exact path="/inquiry_mail/sales/:id(\d*)?" component={SalesDetailPage} />*/}
    <AdminRoute exact path="/inquiry/reply/detail/:id(\d*)?" component={ReplyDetailPage} />
    <Route component={NotFound} />
  </Switch>
);

export default RouteShopMail;
