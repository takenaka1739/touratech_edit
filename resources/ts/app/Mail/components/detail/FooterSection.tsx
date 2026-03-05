// 更新
// パス: resources/ts/app/Mail/components/detail/FooterSection.tsx

import React, { useState } from 'react';
import { Forms } from '@/components';

type Props = {
  state: any;
  errors: any;
  onChange: (name: string, value: any) => void;
  saveClick: (value: any) => void; // ここでは保存に使わない（互換のため残す）
};

export const FooterSection: React.VFC<Props> = ({ state, errors, onChange }) => {
  const [insertKey, setInsertKey] = useState<string>('');

  const insertToken = () => {
    const token = insertKey ? `{{${insertKey}}}` : '';
    if (!token) return;

    const cur = String(state.footer_template ?? '');
    onChange('footer_template', cur + token);
  };

  return (
    <>
      <Forms.FormGroupTextarea
        labelText="フッター"
        name="footer_template"
        value={state.footer_template ?? ''}
        error={errors?.footer_template}
        className="max-w-lg"
        onChange={onChange}
        maxLength={2000}
      />

      <div style={{ display: 'flex' }}>
        <div>
          <Forms.FormGroupSelect
            labelText=""
            name="__footer_insert_key"
            options={[
              { name: '適格請求書発行事業者の登録番号', value: '適格請求書発行事業者の登録番号' },
            ]}
            value={insertKey}
            error={undefined}
            onChange={(_, v) => setInsertKey(String(v ?? ''))}
            required
          />
        </div>

        <button
          className="btn"
          type="button"
          onClick={e => {
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