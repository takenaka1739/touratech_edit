import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { AdminRoute } from '@/components';

import { InquiryReplyListPage } from '@/app/Inquiry/pages/InquiryReplyListPage';
import { InquiryReplyDetailPage } from '@/app/Inquiry/pages/InquiryReplyDetailPage';
import { EcMailConversationPage } from '@/app/Inquiry/pages/EcMailConversationPage';

import { NotFound } from '@/app/App/pages/NotFound';

const RouteShopMail: React.VFC = () => (
  <Switch>

    <AdminRoute exact path="/inquiry" component={InquiryReplyListPage} />
    <AdminRoute exact path="/inquiry_mail" component={InquiryReplyListPage} />

    <AdminRoute
      exact
      path="/inquiry_mail/receive_order/:id"
      component={EcMailConversationPage}
    />

    {/* 問い合わせ詳細 */}
    <AdminRoute exact path="/inquiries/:id" component={InquiryReplyDetailPage} />

    {/* 別名ルート（既存互換） */}
    <AdminRoute exact path="/inquiry/detail/:id" component={InquiryReplyDetailPage} />

    <Route component={NotFound} />
  </Switch>
);

export default RouteShopMail;
