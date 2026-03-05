import React, { useState } from 'react';
import { Forms } from '@/components';

type Props = {
  state: any;
  errors: any;
  onChange: (name: string, value: any) => void;
  saveClick: (value: any) => void; // ← 受け取り復活（未使用）
};

export const HeaderSection: React.VFC<Props> = ({ state, errors, onChange }) => {
  const [insertKey, setInsertKey] = useState<string>('');

  const insertToken = () => {
    const token = insertKey ? `{{${insertKey}}}` : '';
    if (!token) return;
    const cur = String(state.header_template ?? '');
    onChange('header_template', cur + token);
  };

  return (
    <>
      <Forms.FormGroupInputText
        labelText="件名"
        name="subject_template"
        value={state.subject_template ?? ''}
        error={errors?.subject_template}
        onChange={onChange}
        groupClassName="mt-2"
        className="max-w-lg"
        required
      />

      <Forms.FormGroupTextarea
        labelText="ヘッダー"
        name="header_template"
        value={state.header_template ?? ''}
        error={errors?.header_template}
        className="max-w-lg"
        onChange={onChange}
        maxLength={2000}
      />

      <div style={{ display: 'flex' }}>
        <div>
          <Forms.FormGroupSelect
            labelText=""
            name="__header_insert_key"
            options={[
              { name: '適格請求書発行事業者の登録番号', value: '適格請求書発行事業者の登録番号' },
            ]}
            value={insertKey}
            error={undefined}
            onChange={(_, v) => setInsertKey(String(v ?? ''))}
          />
        </div>

        <button
          className="btn"
          type="button"
          onClick={(e) => {
            e.preventDefault();
            insertToken();
          }}
          style={{ height: '28px', marginLeft: '8px', marginTop: '12px' }}
        >
          挿入
        </button>
      </div>
    </>
  );
};