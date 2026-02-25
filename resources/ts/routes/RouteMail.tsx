import { Switch, Route } from 'react-router-dom';
import { AdminRoute } from '@/components';
import { MailListPage } from '@/app/Mail/pages/MailListPage';
import { MailDetailPage } from '@/app/Mail/pages/MailDetailPage';
//import { InquiryReplyListPage } from '@/app/Inquiry/pages/InquiryReplyListPage';
//import { ReplyListPage } from '@/app/Inquiry/pages/ReplyListPage';
//import { ReceiveOrderDetailPage } from '@/app/Inquiry/pages/ReceiveOrderDetailPage';
//import { SalesDetailPage } from '@/app/Inquiry/pages/SalesDetailPage';
//import { ReplyDetailPage } from '@/app/Inquiry/pages/ReplyDetailPage';
import { NotFound } from '@/app/App/pages/NotFound';

const RouteShopMail: React.VFC = () => (
  <Switch>
    <AdminRoute exact path="/mail" component={MailListPage} />
    <AdminRoute exact path="/mail/detail/:id(\d*)?" component={MailDetailPage} />
    <AdminRoute exact path="/mail/detail" component={MailDetailPage} />
    {/*<AdminRoute exact path="/shop_mail_list/detail/:id(\d*)?" component={ShopMailDetailPage} />*/}
    {/*{/*<AdminRoute exact path="/inquiry_mail" component={InquiryReplyListPage} />*/}
    {/*<AdminRoute exact path="/inquiry_mail/reply_list/:id(\d*)?" component={ReplyListPage} />*/}
    {/*<AdminRoute exact path="/inquiry_mail/receive_order/:id(\d*)?" component={ReceiveOrderDetailPage} />*/}
    {/*<AdminRoute exact path="/inquiry_mail/sales/:id(\d*)?" component={SalesDetailPage} />*/}
    {/*<AdminRoute exact path="/inquiry_mail/reply/detail/:id(\d*)?" component={ReplyDetailPage} />*/}
    <Route component={NotFound} />
  </Switch>
);

export default RouteShopMail;
