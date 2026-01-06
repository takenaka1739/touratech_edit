import React from 'react';
import { Forms } from '@/components';

type Props = {
  state: any;
  errors: any;
  onChange: (name: string, value: string | number | boolean | undefined) => void;
};

/**
 * 商品マスタの「備考」入力セクション。
 *
 * - 備考（remarks）
 */
export const ItemRemarksSection: React.VFC<Props> = ({
  state,
  errors,
  onChange,
}) => {
  return (
    <Forms.FormGroupTextarea
      labelText="備考"
      name="remarks"
      value={state.remarks ?? ''}
      error={errors?.remarks}
      className="max-w-lg"
      onChange={onChange}
      maxLength={200}
    />
  );
};
