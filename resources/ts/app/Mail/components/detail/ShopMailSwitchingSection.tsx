import React from 'react';
import { Forms } from '@/components';

type Props = {
  state: any;
  errors: any;
  onChange: (name: string, value: any) => void;
};

export const ShopMailSwitchingSection: React.VFC<Props> = ({
  state,
  errors,
  onChange,
}) => {
  return (
    <>
  {console.log('state.display_status')}
  {console.log(state.display_status)}
      {/* 支払い方法 */}
        <Forms.FormGroupInputRadio
          labelText="メール設定切替"
          name="display_status"
          value={state.display_status}
          error={errors?.display_status}
          onChange={onChange}
          items={[
            { labelText: '自動返信メール設定', id: 'display_status_0', value: 0 },
            { labelText: '個別返信メール設定', id: 'display_status_1', value: 1 },
          ]}
          required={true}
        />
    </>
  );
};