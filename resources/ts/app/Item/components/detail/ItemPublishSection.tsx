import React from 'react';
import { Forms } from '@/components';

type Props = {
  state: any;
  errors: any;
  onChange: (name: string, value: any) => void;
};

/**
 * 商品マスタの「ショップ公開」セクション。
 *
 * - ショップ公開フラグ（is_sell）
 */
export const ItemPublishSection: React.VFC<Props> = ({
  state,
  errors,
  onChange,
}) => {
  return (
    <div className="is-public publish-wrapper">
      <Forms.FormGroup
        labelText="ショップ公開"
        error={errors?.is_sell}
        groupClassName="items-required mt-4"
      >
        <Forms.FormInputCheck
          id="is_sell"
          name="is_sell"
          checked={state.is_sell}
          onChange={onChange}
        />
      </Forms.FormGroup>
    </div>
  );
};
