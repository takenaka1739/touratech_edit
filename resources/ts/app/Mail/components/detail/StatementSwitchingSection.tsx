// 更新
// パス: resources/ts/app/Mail/components/detail/StatementSwitchingSection.tsx

import React from 'react';
import { Forms } from '@/components';

type Props = {
  state: any;
  errors: any;
  onChange: (name: string, value: any) => void;
};

export const StatementSwitchingSection: React.VFC<Props> = ({ state, errors, onChange }) => {
  return (
    <>
      <Forms.FormGroupInputRadio
        labelText="お買い上げ明細"
        name="detail_mode"
        value={Number(state.detail_mode ?? 0)}
        error={errors?.detail_mode}
        onChange={onChange}
        items={[
          { labelText: '表示する', id: 'detail_mode_1', value: 1 },
          { labelText: '表示しない', id: 'detail_mode_0', value: 0 },
        ]}
        required={true}
      />
      <label>※ 自動返信メールの設定と同じ形式で記載されます。</label>
    </>
  );
};