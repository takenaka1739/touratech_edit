import React from 'react';
import { Forms } from '@/components';

type Props = {
  state: any;
  errors: any;
  onChange: (name: string, value: any) => void;
};

const TYPE_AUTO = 1;
const TYPE_INDIV = 2;

export const ShopMailSwitchingSection: React.VFC<Props> = ({ state, errors, onChange }) => {
  return (
    <>
      <Forms.FormGroupInputRadio
        labelText="メール種別"
        name="template_type"
        value={Number(state.template_type ?? TYPE_AUTO)}
        error={errors?.template_type}
        onChange={onChange}
        items={[
          { labelText: '自動返信メール', id: 'template_type_1', value: TYPE_AUTO },
          { labelText: '個別返信メール', id: 'template_type_2', value: TYPE_INDIV },
        ]}
        required={true}
      />
    </>
  );
};