import React from 'react';
import { Forms } from '@/components';

type Props = {
  state: any;
  errors: any;
  onChange: (name: string, value: any) => void;
};

/**
 * 商品マスタの「在庫・廃盤・表示設定」セクション。
 *
 * - 確認（is_discontinued）
 * - 廃盤日（discontinued_at）
 * - 廃盤（is_display）
 * - 国内在庫数 / 国外在庫数（読み取り専用）
 * - 在庫表示（display_status）
 */
export const ItemStatusSection: React.VFC<Props> = ({
  state,
  errors,
  onChange,
}) => {
  return (
    <>
      {/* 廃盤・廃盤日・表示 */}
      <div className="flex">
        <div>
          <Forms.FormGroup
            labelText="確認"
            error={errors?.is_discontinued}
            groupClassName="items-center mt-4"
          >
            <Forms.FormInputCheck
              id="is_discontinued"
              name="is_discontinued"
              checked={state.is_discontinued}
              onChange={onChange}
            />
          </Forms.FormGroup>
        </div>

        <div>
          <Forms.FormGroupInputDate
            labelText="廃盤日"
            name="discontinued_at"
            value={state.discontinued_at}
            error={errors?.discontinued_at}
            onChange={onChange}
            readOnly={!state.is_discontinued}
          />
        </div>

        <div>
          <Forms.FormGroup
            labelText="廃盤"
            error={errors?.is_display}
            groupClassName="items-center mt-4"
            removeOptionalLabel
          >
            <Forms.FormInputCheck
              id="is_display"
              name="is_display"
              checked={state.is_display}
              onChange={onChange}
            />
          </Forms.FormGroup>
        </div>
      </div>

      {/* 国内・国外在庫 */}
      <div className="flex max-w-xl">
        <div className="w-1/2">
          <Forms.FormGroupInputText
            labelText="国内在庫数"
            name="domestic_stocks"
            value={state.domestic_stocks ?? '0'}
            className="max-w-8 text-right"
            readOnly
            removeOptionalLabel
          />
        </div>

        <div className="w-1/2">
          <Forms.FormGroupInputText
            labelText="国外在庫数"
            name="overseas_stocks"
            value={state.overseas_stocks ?? '0'}
            className="max-w-8 text-right"
            readOnly
            removeOptionalLabel
          />
        </div>
      </div>

      {/* 在庫表示 */}
      <Forms.FormGroupInputRadio
        labelText="在庫表示"
        name="display_status"
        value={state.display_status}
        error={errors?.display_status}
        onChange={onChange}
        items={[
          { labelText: '非表示', id: 'display_status_0', value: 0 },
          { labelText: '表示（一般含む）', id: 'display_status_1', value: 1 },
          { labelText: '表示（業者のみ）', id: 'display_status_2', value: 2 },
        ]}
        required={true}
      />
    </>
  );
};
