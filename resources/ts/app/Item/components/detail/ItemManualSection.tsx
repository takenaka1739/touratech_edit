import React from 'react';
import { Forms } from '@/components';

type Props = {
  state: any;
  errors: any;
  onChange: (name: string, value: any) => void;
  typeName: string;
  onChangeTypeName: (event: React.ChangeEvent<HTMLInputElement>) => void;
  typeNameBackColor: string;

  fileInputRef: React.RefObject<HTMLInputElement>;
  handleClick: () => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

/**
 * 商品マスタの「取扱説明書設定」セクション。
 *
 * - 取扱説明書設定（type_status）
 * - その他選択時の自由入力欄（typeName）
 * - ファイル選択（file_name + hidden file input）
 *
 * 取扱説明書に関する設定をまとめた領域。
 */
export const ItemManualSection: React.VFC<Props> = ({
  state,
  errors,
  onChange,
  typeName,
  onChangeTypeName,
  typeNameBackColor,
  fileInputRef,
  handleClick,
  handleFileChange,
}) => {
  return (
    <div style={{ alignItems: 'center', marginTop: '15px' }}>
      {/* 取扱説明書設定 + その他入力 */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', width: '627px' }}>
        <Forms.FormGroupInputRadio
          labelText="取扱説明書設定"
          name="type_status"
          value={state.type_status}
          error={errors?.type_status}
          onChange={onChange}
          items={[
            { labelText: 'なし', id: 'type_status_0', value: 0 },
            { labelText: '取扱説明書', id: 'type_status_1', value: 1 },
            { labelText: 'サイズ表', id: 'type_status_2', value: 2 },
            { labelText: 'その他', id: 'type_status_3', value: 3 },
          ]}
          required={false}
        />

        <input
          className="vari-row-input"
          disabled={state.type_status !== 3}
          style={{
            borderRight: '1px solid #a0aec0',
            backgroundColor: typeNameBackColor,
            width: '200px',
          }}
          value={typeName}
          onChange={onChangeTypeName}
        />
      </div>

      {/* ファイル選択 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          marginLeft: '160px',
          marginTop: '10px',
        }}
      >
        <label style={{ marginRight: '5px' }}>ファイル選択</label>

        <Forms.FormInputText
          name="file_name"
          value={state.file_name}
          error={errors?.file_name}
          className="file_name"
          readOnly
        />

        <button onClick={handleClick} className="file_btn ml-2 py-0 px-2">
          ...
        </button>

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};
