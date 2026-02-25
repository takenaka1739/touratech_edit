import React from 'react';
import { Forms } from '@/components';

type Props = {
  state: any;
  errors: any;
  onChange: (name: string, value: any) => void;
};

export const StatementSwitchingSection: React.VFC<Props> = ({
  state,
  errors,
  onChange,
}) => {
  return (
    <>
      {/* 支払い方法 */}
        <Forms.FormGroupInputRadio
          labelText="お買い上げ明細"
          name="display_change_status"
          value={state.display_status}
          error={errors?.display_status}
          onChange={onChange}
          items={[
            { labelText: '表示する', id: 'display_status_0', value: 0 },
            { labelText: '表示しない', id: 'display_status_1', value: 1 },
          ]}
          required={true}
        />
        <label>※ 自動返信メールの設定と同じ形式で記載されます。</label>
    </>
  );
};