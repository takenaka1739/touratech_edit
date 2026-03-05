// 更新
// パス: resources/ts/app/Mail/pages/AutoReplySettingPage.tsx

import React from 'react';
import { Forms } from '@/components';
import { HeaderSection } from '@/app/Mail/components/detail/HeaderSection';
import { FooterSection } from '@/app/Mail/components/detail/FooterSection';
import { StatementSection } from '@/app/Mail/components/detail/StatementSection';

type Props = {
  state: any;
  errors: any;
  onChange: (name: string, value: any) => void;
  saveClick: (value: any) => void;
};

export const AutoReplySettingPage: React.VFC<Props> = ({ state, errors, onChange, saveClick }) => {
  return (
    <>
      {/* 自動返信（テンプレ有効/無効） */}
      <Forms.FormGroupInputRadio
        labelText="自動返信"
        name="is_active"
        value={Number(state.is_active ?? 1)}
        error={errors?.is_active}
        onChange={onChange}
        items={[
          { labelText: 'する', id: 'is_active_1', value: 1 },
          { labelText: 'しない', id: 'is_active_0', value: 0 },
        ]}
        required={true}
      />

      {/* 題名（DB: title） */}
      <Forms.FromGroupInputItemNumber
        labelText="題名（表示用）"
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
      <StatementSection state={state} errors={errors} onChange={onChange} saveClick={saveClick} />
      <FooterSection state={state} errors={errors} onChange={onChange} saveClick={saveClick} />
    </>
  );
};