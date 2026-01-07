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
    variItems = state.variItems.map((row: any) => {
      if (!Array.isArray(row)) return ['', '', '', '', '', '', ''];
      if (row.length < 7) return ['', '', '', '', '', '', ''];
      return row;
    });
  } else {
    // 初期行（7 カラム）
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
              isDisabled={isDisabled || !isVariationEditable}
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
