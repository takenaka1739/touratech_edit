import React from 'react';
import { Forms } from '@/components';

type Props = {
  state: any;
  errors: any;
  onChange: (name: string, value: any) => void;
};

export const AutoReplySection: React.VFC<Props> = ({
  state,
  errors,
  onChange,
}) => {
  return (
    <>
      <Forms.FormGroup
        labelText="自動返信メール送信日時"
        groupClassName="items-start mt-4"
        required={false}
        error={errors?.payErrorMessage}
      >
        <Forms.FormInputDate
          name="start_at"
          value={state.start_at ? new Date(state.start_at) : null}
          error={errors?.start_at}
          onChange={onChange}
        />
      </Forms.FormGroup>

      <div style={{display: 'flex'}}>
        <div style={{height: '28px'}}>
          <Forms.FormGroupSelect
            id="is_payment_id4"
            name="is_payment_id4"
            labelText="自動送信メール"
            checked={state.is_payment_id4}
            onChange={onChange}
            options={[
              { value: 'gte', name: '以上' },
              { value: 'lte', name: '以下' },
              { value: 'eq', name: 'と一致する' },
            ]}
          />
        </div>
        <p className='form-label-text items-start mt-4' style={{marginLeft: '8px', marginRight: '8px'}}>のテンプレートを使って</p>
        <button className="btn" style={{height: '28px', marginTop: '10px'}}>個別返信メール送信</button>
      </div>

      <Forms.FormGroup
        labelText="商品評価メール送信日時"
        groupClassName="items-start mt-4"
        required={false}
        error={errors?.payErrorMessage}
      >
        <div>
          <p>未送信</p>
          <button className="btn">商品評価メール送信</button>
        </div>
      </Forms.FormGroup>

      {/* 支払い方法 */}
      <Forms.FormGroup
        labelText="伝票確認"
        groupClassName="items-start mt-4"
        required={false}
        error={errors?.payErrorMessage}
      >
        <Forms.FormInputCheck
          id="is_payment_id1"
          name="is_payment_id1"
          labelText="未確認にする"
          checked={state.is_payment_id1}
          onChange={onChange}
        />
      </Forms.FormGroup>
    </>
  );
};