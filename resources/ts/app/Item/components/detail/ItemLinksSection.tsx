import React from 'react';
import { Forms } from '@/components';

type Props = {
  state: any;
  errors: any;
  onChange: (name: string, value: any) => void;
  linkName: string;
  onChangeLinkName: (event: React.ChangeEvent<HTMLInputElement>) => void;
  linkNameBackColor: string;
};

/**
 * 商品マスタの「国外リンク」セクション。
 *
 * - 取扱説明書設定（type_status）
 * - その他選択時の自由入力欄（typeName）
 * - ファイル選択（file_name + hidden file input）
 *
 * 取扱説明書に関する設定をまとめた領域。
 */
export const ItemLinksSection: React.VFC<Props> = ({
  state,
  errors,
  onChange,
  linkName,
  onChangeLinkName,
  linkNameBackColor,
}) => {
  return (
    <div className="manual-section">
      {/* 取扱説明書設定 + その他入力 */}
      <div className="manual-type-row">
        <Forms.FormGroupInputRadio
          labelText="国外リンク"
          name="type_status_link"
          value={state.type_status_link}
          error={errors?.type_status_link}
          onChange={onChange}
          items={[
            { labelText: 'なし', id: 'type_status_link_0', value: 0 },
            { labelText: '取扱説明書', id: 'type_status_link_1', value: 1 },
            { labelText: 'サイズ表', id: 'type_status_link_2', value: 2 },
            { labelText: 'その他', id: 'type_status_link_3', value: 3 },
          ]}
          required={false}
        />

        <input
          className="vari-row-input manual-type-input"
          disabled={state.type_status_link !== 3}
          value={linkName}
          onChange={onChangeLinkName}
          data-bgcolor={linkNameBackColor}
        />
      </div>

      {/* ファイル選択 */}
      <div className="manual-file-row">
        <label className="manual-file-label">URL</label>

        <Forms.FormInputText
          name="link_url"
          value={state.link_url}
          error={errors?.link_url}
          onChange={onChange}
          className="file_name"
        />
      </div>
    </div>
  );
};

