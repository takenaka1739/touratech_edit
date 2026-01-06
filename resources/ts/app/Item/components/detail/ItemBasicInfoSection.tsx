import React from 'react';
import { Forms } from '@/components';

type Props = {
  state: any;
  errors: any;
  onChange: (name: string, value: string | number | boolean | undefined) => void;
};

/**
 * 商品マスタの「基本情報」入力セクション。
 * 
 * - 品番
 * - 商品名
 * - 商品名 (納品書)
 * - 商品名 (ラベル用)
 */
export const ItemBasicInfoSection: React.VFC<Props> = ({
  state,
  errors,
  onChange,
}) => {
  return (
    <>
      <Forms.FromGroupInputItemNumber
        labelText="品番"
        name="item_number"
        value={state.item_number}
        error={errors?.item_number}
        onChange={onChange}
        groupClassName="mt-0"
        className="max-w-lg"
        required
        autoFocus
      />

      <Forms.FormGroupInputText
        labelText="商品名"
        name="name"
        value={state.name}
        error={errors?.name}
        onChange={onChange}
        className="max-w-lg"
        required
        maxLength={401}
      />

      <Forms.FormGroupInputText
        labelText="商品名（納品書）"
        name="name_note"
        value={state.name_note}
        error={errors?.name_note}
        onChange={onChange}
        className="max-w-lg"
        required
        maxLength={401}
      />

      <Forms.FormGroupInputText
        labelText="商品名（ラベル用）"
        name="name_label"
        value={state.name_label ?? ''}
        error={errors?.name_label}
        onChange={onChange}
        className="max-w-lg"
        maxLength={401}
      />
    </>
  );
};
