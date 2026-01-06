import React from 'react';
import { Forms } from '@/components';

type Props = {
  state: any;
  errors: any;
  onChange: (name: string, value: string | number | boolean | undefined) => void;
};

/**
 * 商品マスタの「商品説明」入力セクション。
 *
 * - 商品説明（description）
 * - 商品説明（詳細）（description_detail）
 */
export const ItemDescriptionSection: React.VFC<Props> = ({
  state,
  errors,
  onChange,
}) => {
  return (
    <>
      <Forms.FormGroupTextarea
        labelText="商品説明"
        name="description"
        value={state.description ?? ''}
        error={errors?.description}
        className="max-w-lg"
        onChange={onChange}
        maxLength={2000}
      />

      <Forms.FormGroupTextarea
        labelText="商品説明（詳細）"
        name="description_detail"
        value={state.description_detail ?? ''}
        error={errors?.description_detail}
        className="max-w-lg"
        onChange={onChange}
        maxLength={5000}
      />
    </>
  );
};
