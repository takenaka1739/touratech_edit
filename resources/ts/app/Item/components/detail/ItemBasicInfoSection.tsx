import React, { useState } from 'react';
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
  const [isNameNoteEditable, setIsNameNoteEditable] = useState(
    (state.name_note ?? '') !== '' && (state.name_note ?? '') !== (state.name ?? '')
  );

  const onChangeNameNoteEditable = (
    _name: string,
    value: string | number | boolean | undefined
  ) => {
    const checked = value === true || value === 'true';

    if (checked) {
      onChange('name_note', state.name ?? '');
    } else {
      onChange('name_note', state.name ?? '');
    }

    setIsNameNoteEditable(checked);
  };

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

      <Forms.FormGroup
        labelText="納品書名を個別設定"
        groupClassName="items-center my-1"
        removeOptionalLabel
      >
        <Forms.FormInputCheck
          id="is_name_note_editable"
          name="is_name_note_editable"
          checked={isNameNoteEditable}
          onChange={onChangeNameNoteEditable}
        />
      </Forms.FormGroup>

      <Forms.FormGroupInputText
        labelText="商品名（納品書）"
        name="name_note"
        value={isNameNoteEditable ? (state.name_note ?? '') : (state.name ?? '')}
        error={errors?.name_note}
        onChange={onChange}
        className="max-w-lg"
        maxLength={401}
        readOnly={!isNameNoteEditable}
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