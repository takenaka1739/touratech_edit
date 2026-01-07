import React from 'react';
import { ItemVariationHeader, ItemVariationRow } from '@/app/Item/components/variation';

type Props = {
  state: any;
  errors: any;
  isVariationEditable: boolean;
  isDisabled: boolean;
  handleCheck: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeValue: (e: React.ChangeEvent<HTMLInputElement>, row: number, col: number) => void;
  addNewVari: (row: number, col: number) => void;
  delButton: (row: number) => void;
  handleFocus: (item: string[]) => void;
  outForcus: (item: string[]) => void;
};


/**
 * 商品マスタの「バリエーション」セクション。
 *
 * - バリエーション追加チェック
 * - バリエーションヘッダー
 * - バリエーション行（ItemVariationRow）
 * - エラー表示
 */
export const ItemVariationSection: React.VFC<Props> = ({
  state,
  errors,
  isVariationEditable,
  isDisabled,
  handleCheck,
  onChangeValue,
  addNewVari,
  delButton,
  handleFocus,
  outForcus,
}) => {

// 最低 1 行は必ず表示させる（state.variItems が空 or 不正な場合の補正）
let variItems: any[] = [];

  if (Array.isArray(state.variItems) && state.variItems.length > 0) {
    // 各行が 7 カラム未満なら補正する
    variItems = state.variItems.map((row: any, rowIndex: number) => {
      if (!Array.isArray(row)) return ['', '', '', '', '', '', ''];

      // 7 カラムに揃えつつ、null/undefined を正しく扱う
      const fixed = Array.from({ length: 7 }).map((_, i) => {
        const v = row[i];

        // 初期行（rowIndex === 0）は null → '' にする（全部表示）
        if (rowIndex === 0){
          return v === null || v === undefined ? '' : v;
        }

        // index 1〜4 → バリエーション1〜4
        if (i >= 1 && i <= 4) {
          return v === undefined ? null : v;
        }

        // 品番・価格（常に visible）
        if (i === 5 || i === 6) {
          return v === null || v === undefined ? '' : v;
        }

        // index 0 → id（null のままでも OK）
        return v === undefined ? null : v;
      });

      return fixed;
    });
  } else {
    // 初期行（バリ1〜4は表示、品番・価格も表示）
    variItems = [['', '', '', '', '', '', '']];
  }

  return (
    <>
      {/* バリエーション追加チェック */}
      <div style={{ marginTop: '8px' }}>
        <label>バリエーション追加</label>
        <label className="label-optional">任意</label>
        <input
          style={{ marginTop: '5px' }}
          type="checkbox"
          checked={isVariationEditable}
          onChange={handleCheck}
        />
      </div>

      {/* バリエーション一覧 */}
      <div style={{ marginLeft: '160px' }}>
        <ItemVariationHeader />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {variItems.map((item: any, itemIndex: number) => (
            <ItemVariationRow
              key={itemIndex}
              item={item}
              itemIndex={itemIndex}
              // チェックON かつ 全体が有効なときだけ編集可能
              isEditable={isVariationEditable && !isDisabled}
              isDisabled={isDisabled}
              onChangeValue={onChangeValue}
              onAdd={addNewVari}
              onDelete={delButton}
              onFocus={handleFocus}
              onBlur={outForcus}
              // チェックOFFのときは削除ボタンも非表示
              showDelete={variItems.length > 1 && isVariationEditable && !isDisabled}
            />
          ))}
        </div>

        {/* エラー表示（validateItemState の variation_◯ をすべて表示） */}
        {Object.keys(errors || {})
          .filter(key => key.startsWith('variation_'))
          .map(key => (
            <div key={key} className="form-error" style={{ marginTop: '5px' }}>
              {errors[key]}
            </div>
          ))}
      </div>
    </>
  );
};
