import React from 'react';
import { PageWrapper } from '@/components';

/**
 * お問い合わせ（一覧）画面 Component
 */
export const InquiryReplyDetailPage: React.VFC = () => {

  //const slug = 'calendar';
  const slug = 'calendar';
  const title = 'お問い合わせ詳細';

  return (
    <PageWrapper prefix={slug} title={title} breadcrumb={[{ name: title }]}>

    </PageWrapper>
  );
};
