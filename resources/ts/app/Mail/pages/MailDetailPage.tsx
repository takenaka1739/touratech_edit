import React from 'react';
import { PageWrapper } from '@/components';
import { ShopMailSwitchingSection } from '@/app/Mail/components/detail/ShopMailSwitchingSection';
import { useMailDetailPage } from '@/app/Mail/uses/useMailDetailPage';
import { AutoReplySettingPage } from '@/app/Mail/pages/AutoReplySettingPage';
import { IndividualReplySettingPage } from '@/app/Mail/pages/IndividualReplySettingPage';

/**
 * 画面 Component
 */
export const MailDetailPage: React.VFC = () => {

  const {
    id,
    isDisabled,
    title,
    slug,
    state,
    errors,
    //delButton,
    onChange,
    saveClick
  } = useMailDetailPage();

  {console.log('state.display_status')}
  {console.log(state.display_status)}

  return (
    //<PageWrapper prefix={slug} title={title} breadcrumb={[]} isLoading={isLoading}>
    <PageWrapper prefix={slug} title={title} breadcrumb={[]}>
      <ShopMailSwitchingSection
        state={state}
        errors={errors}
        onChange={onChange}
      />
      <div className="form-group-wrapper">
        {state.display_status === 0 ? (
        <AutoReplySettingPage
          state={state}
          errors={errors}
          onChange={onChange}
          saveClick={saveClick}
        />) : (
        <IndividualReplySettingPage
          state={state}
          errors={errors}
          onChange={onChange}
          saveClick={saveClick}/>
        )}
      </div>

      <div className="flex justify-between">
        <div>
          <button className="btn" onClick={saveClick} disabled={isDisabled}>保存</button>
        </div>

        {id && (
          <button className="btn-delete" disabled={isDisabled}>
            削除
          </button>
          /*<button className="btn-delete" onClick={() => delButton(-1)} disabled={isDisabled}>
            削除
          </button>*/
        )}
      </div>
    </PageWrapper>
  );
};