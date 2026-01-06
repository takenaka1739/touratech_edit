import React from 'react';
import { Forms } from '@/components';

type Props = {
  selected: number[] | undefined;
  onSelected: (value: number) => void;
  onClickPrint: () => void;
  onClickPrintNoPrice: () => void;
  error?: string;
};

/**
 * 商品マスタの「ラベル発行」セクション。
 *
 * - ラベル位置選択（FormLabelSelector）
 * - ラベル発行ボタン
 * - ラベル発行（金額なし）ボタン
 * - エラー表示
 */
export const ItemLabelSection: React.VFC<Props> = ({
  selected,
  onSelected,
  onClickPrint,
  onClickPrintNoPrice,
  error,
}) => {
  return (
    <div className="flex mt-4">
      {/* ラベル位置 */}
      <div className="w-40 pr-2 text-xs text-right">ラベル位置</div>

      <div className="w-full">
        <div className="flex ml-8">
          {/* ラベル位置セレクタ */}
          <Forms.FormLabelSelector selected={selected} onSelected={onSelected} />

          {/* ラベル発行 */}
          <div className="w-32">
            <div className="form-group">
              <button className="btn ml-8" onClick={onClickPrint}>
                ラベル発行
              </button>
            </div>
          </div>

          {/* ラベル発行（金額なし） */}
          <div className="w-64">
            <div className="form-group">
              <button className="btn ml-8" onClick={onClickPrintNoPrice}>
                ラベル発行(金額なし)
              </button>
            </div>
          </div>
        </div>

        {/* エラー表示 */}
        <div className="w-full">
          {error && <div className="form-error">{error}</div>}
        </div>
      </div>
    </div>
  );
};
