import React from 'react';
import { Forms } from '@/components';

type Props = {
  id: number | null;
  domesticUrl: string;
  overseasUrl: string;
};

/**
 * 商品マスタの「国内リンク / 国外リンク」セクション。
 *
 * - 商品 ID が存在する場合のみ表示
 * - 国内リンク
 * - 国外リンク
 */
export const ItemLinksSection: React.VFC<Props> = ({
  id,
  domesticUrl,
  overseasUrl,
}) => {
  if (!id) return null;

  return (
    <>
      <hr className="border-dashed border-gray-400 mt-4" />

      <Forms.FormGroup labelText="国内リンク" removeOptionalLabel>
        <span
          className="text-xs text-blue-600 underline cursor-pointer"
          onClick={() => {
            window.open(domesticUrl, '_blank', 'left=100,top=100,noopener=yes');
          }}
        >
          {domesticUrl}
        </span>
      </Forms.FormGroup>

      <Forms.FormGroup labelText="国外リンク" removeOptionalLabel>
        <span
          className="text-xs text-blue-600 underline cursor-pointer"
          onClick={() => {
            window.open(overseasUrl, '_blank', 'left=100,top=100,noopener=yes');
          }}
        >
          {overseasUrl}
        </span>
      </Forms.FormGroup>

      <hr className="border-dashed border-gray-400 mt-4" />
    </>
  );
};

