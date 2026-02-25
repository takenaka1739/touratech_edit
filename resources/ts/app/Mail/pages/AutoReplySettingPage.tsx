import React from 'react';
import { Forms } from '@/components';
import { HeaderSection } from '@/app/Mail/components/detail/HeaderSection';
import { FooterSection } from '@/app/Mail/components/detail/FooterSection';
import { StatementSection} from '@/app/Mail/components/detail/StatementSection';

type Props = {
  state: any;
  errors: any;
  onChange: (name: string, value: any) => void;
  saveClick: (value: any) => void;
};

export const AutoReplySettingPage: React.VFC<Props> = ({
  state,
  errors,
  onChange,
  saveClick
}) => {
  return (
    <>
      {/* 自動返信 */}
      <Forms.FormGroupInputRadio
        labelText="自動返信"
        name="display_status"
        value={state.display_status}
        error={errors?.display_status}
        onChange={onChange}
        items={[
          { labelText: 'する', id: 'display_status_0', value: 0 },
          { labelText: 'しない', id: 'display_status_1', value: 1 },
        ]}
        required={true}
      />
      {/* 題目 */}
      <Forms.FromGroupInputItemNumber
        labelText="題名"
        name="item_number"
        value={state.item_number}
        error={errors?.item_number}
        onChange={onChange}
        groupClassName="mt-2"
        className="max-w-lg"
        required
        autoFocus
      />
      {/* ヘッダー */}
      <HeaderSection
        state={state}
        errors={errors}
        onChange={onChange}
        saveClick={saveClick}
      />
      <StatementSection
        state={state}
        errors={errors}
        onChange={onChange}
        saveClick={saveClick}
      />
      <FooterSection
        state={state}
        errors={errors}
        onChange={onChange}
        saveClick={saveClick}
      />
    </>
  );
};