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
 * - 商品説明（explanation）
 * - 商品説明（詳細）（explanation_details）
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
        name="explanation"
        value={state.explanation ?? ''}
        error={errors?.explanation}
        className="max-w-lg"
        onChange={onChange}
        maxLength={2000}
      />

      <Forms.FormGroupTextarea
        labelText="商品説明（詳細）"
        name="explanation_details"
        value={state.explanation_details ?? ''}
        error={errors?.explanation_details}
        className="max-w-lg"
        onChange={onChange}
        maxLength={5000}
      />
    </>
  );
};
