// 更新
// パス: resources/ts/app/Mail/pages/IndividualReplySettingPage.tsx

import React from 'react';
import { Forms } from '@/components';
import { HeaderSection } from '@/app/Mail/components/detail/HeaderSection';
import { StatementSwitchingSection } from '@/app/Mail/components/detail/StatementSwitchingSection';
import { FooterSection } from '@/app/Mail/components/detail/FooterSection';

type Props = {
  state: any;
  errors: any;
  onChange: (name: string, value: any) => void;
  saveClick: (value: any) => void;
};

export const IndividualReplySettingPage: React.VFC<Props> = ({ state, errors, onChange, saveClick }) => {
  return (
    <>
      {/* 題名（DB: title） */}
      <Forms.FromGroupInputItemNumber
        labelText="題名"
        name="title"
        value={state.title ?? ''}
        error={errors?.title}
        onChange={onChange}
        groupClassName="mt-2"
        className="max-w-lg"
        required
        autoFocus
      />

      <HeaderSection state={state} errors={errors} onChange={onChange} saveClick={saveClick} />
      <StatementSwitchingSection state={state} errors={errors} onChange={onChange} />
      <FooterSection state={state} errors={errors} onChange={onChange} saveClick={saveClick} />
    </>
  );
};