import React from 'react';
import { Forms } from '@/components';

type Props = {
  state: any;
  errors: any;
  onChange: (name: string, value: any) => void;
};

/**
 * 商品マスタの「商品コード」セクション。
 *
 * - 商品コード（code）
 */
export const ItemCodeSection: React.VFC<Props> = ({
  state,
  errors,
  onChange,
}) => {
  return (
    <Forms.FormGroupInputText
      labelText="商品コード"
      name="code"
      value={state.code}
      error={errors?.code}
      onChange={onChange}
      className="max-w-lg"
      maxLength={50}
    />
  );
};
