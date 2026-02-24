import React from 'react';
import { PageWrapper } from '@/components';
import { ShopMailSwitchingSection } from '@/app/ShopMail/components/detail/ShopMailSwitchingSection';
import { useShoMailPage } from '@/app/ShopMail/uses/useShoMailPage';
//import { AutoReplySettingPage } from '@/app/ShopMail/pages/AutoReplySettingPage';
import { IndividualReplySettingPage } from '@/app/ShopMail/pages/IndividualReplySettingPage';

/**
 * 画面 Component
 */
export const ShopMailPage: React.VFC = () => {
  const {
    title,
    slug,
    state,
    errors,
    onChange,
    saveClick
  } = useShoMailPage();

  return (
    //<PageWrapper prefix={slug} title={title} breadcrumb={[]} isLoading={isLoading}>
    <PageWrapper prefix={slug} title={title} breadcrumb={[]}>
      <ShopMailSwitchingSection
        state={state}
        errors={errors}
        onChange={onChange}
      />
      <div className="form-group-wrapper">
        {/*<AutoReplySettingPage
          state={state}
          errors={errors}
          onChange={onChange}
          saveClick={saveClick}
        />*/}
        <IndividualReplySettingPage
          state={state}
          errors={errors}
          onChange={onChange}
          saveClick={saveClick}/>
      </div>
    </PageWrapper>
  );
};