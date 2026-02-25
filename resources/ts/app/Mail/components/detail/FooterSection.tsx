import React from 'react';
import { Forms } from '@/components';

type Props = {
  state: any;
  errors: any;
  onChange: (name: string, value: any) => void;
  saveClick: (value: any) => void;
};

export const FooterSection: React.VFC<Props> = ({
  state,
  errors,
  onChange,
  saveClick,
}) => {
  return (
    <>
      <Forms.FormGroupTextarea
        labelText="フッター"
        name="explanation"
        value={state.explanation ?? ''}
        error={errors?.explanation}
        className="max-w-lg"
        onChange={onChange}
        maxLength={2000}
      />
      <div style={{display: 'flex'}}>
        <div>
          <Forms.FormGroupSelect
            labelText=""
            name="company_level"
            options={[
              { name: "適格請求書発行事業者の登録番号", value: "適格請求書発行事業者の登録番号" },
            ]}
            value={""}
            error={errors?.company_level}
            onChange={onChange}
            required
          />
        </div>
        <button className="btn" onClick={saveClick}
                style={{height: '28px', marginLeft: '8px', marginTop: '12px'}}>挿入</button>
      </div>
    </>
  );
};