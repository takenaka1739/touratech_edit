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
  return (
    <>
      {/* バリエーション追加チェック */}
      <div style={{ marginTop: '8px' }}>
        <label>バリエーション追加</label>
        <label className="label-optional">任意</label>
        <input
          style={{ marginTop: '5px' }}
          type="checkbox"
          onChange={handleCheck}
        />
      </div>

      {/* バリエーション一覧 */}
      <div style={{ marginLeft: '160px' }}>
        <ItemVariationHeader />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {state.variItems.map((item: any, itemIndex: number) => (
            <ItemVariationRow
              key={itemIndex}
              item={item}
              itemIndex={itemIndex}
              isEditable={isVariationEditable}
              onChangeValue={onChangeValue}
              onAdd={addNewVari}
              onDelete={delButton}
              onFocus={handleFocus}
              onBlur={outForcus}
              showDelete={state.variItems.length > 1}
              isDisabled={isDisabled}
            />
          ))}
        </div>

        {/* エラー表示 */}
        {errors?.variation && (
          <div style={{ color: 'red', marginTop: '5px' }}>
            {errors.variation}
          </div>
        )}
      </div>
    </>
  );
};
