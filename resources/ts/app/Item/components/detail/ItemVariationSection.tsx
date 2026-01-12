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
  errorMap: boolean[][];
};

/**
 * 縦線の位置を計算する
 * 上半分：up, 下半分：bottom, フル：full, 縦線なし：none
 */
const calcVerticalLines = (variItems: any[]) => {
  const verticalLines: string[][] = [];

  // 描画判定対象ループ
  for (let i = 0; i < variItems.length; i++) {
    const itemI = variItems[i].slice(1, 5);
    const firstFilledIndexI = itemI.findIndex((v: string | null) => v !== null);

    const lineStates = ['none', 'none', 'none'];

    // 上の行と繋げる縦線（└）の描画判定
    if ((i !== 0) && (firstFilledIndexI > 0)) {
      lineStates[firstFilledIndexI - 1] = 'up';
    }

    // 比較対象ループ（下の行と繋げる縦線（┬）の描画位置算出）
    let lastBottomIndex = 4;
    for (let j = i + 1; j < variItems.length; j++) {
      const itemJ = variItems[j].slice(1, 5);
      const firstFilledIndexJ = itemJ.findIndex((v: string | null) => v !== null);

      // 判定対象より null 以外の開始位置が手前の行がきたら break
      if (firstFilledIndexI >= firstFilledIndexJ) break;

      if (lastBottomIndex > firstFilledIndexJ) {
        lineStates[firstFilledIndexJ - 1] = 'bottom';
        lastBottomIndex = firstFilledIndexJ;
      }
    }

    verticalLines.push(lineStates);
  }

  // 下の行と繋げる縦線（┬）と上の行と繋げる縦線（└）の間を補完する線（｜）の描画
  const filledFlags = [false, false, false, false];
  for (let i = verticalLines.length - 1; i > 0; i--)
  {
    for (let j = 0; j < 4; j++)
    {
      if (verticalLines[i][j] === 'bottom')
      {
        filledFlags[j] = false;
      }
      else if (!filledFlags[j] && verticalLines[i][j] === 'up')
      {
        filledFlags[j] = true;
      }
      else if (filledFlags[j])
      {
        verticalLines[i][j] = 'full';
      }
    }
  }

  return verticalLines;
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
  errorMap,
}) => {

  // 最低 1 行は必ず表示させる（state.variItems が空 or 不正な場合の補正）
  let variItems: any[] = [];

  if (Array.isArray(state.variItems) && state.variItems.length > 0) {
    variItems = state.variItems.map((row: any, rowIndex: number) => {
      if (!Array.isArray(row)) return ['', '', '', '', '', '', ''];

      const fixed = Array.from({ length: 7 }).map((_, i) => {
        const v = row[i];

        if (rowIndex === 0) {
          return v === null || v === undefined ? '' : v;
        }

        if (i >= 1 && i <= 4) {
          return v === undefined ? null : v;
        }

        if (i === 5 || i === 6) {
          return v === null || v === undefined ? '' : v;
        }

        return v === undefined ? null : v;
      });

      return fixed;
    });
  } else {
    variItems = [['', '', '', '', '', '', '']];
  }

  // バリエーションツリー縦線の描画位置の計算
  const verticalLines = calcVerticalLines(variItems);
  console.log("【ItemVariationSection】variItems:", variItems);

  return (
    <>
      {/* バリエーション追加チェック */}
      <div className="variation-add-check">
        <label>バリエーション追加</label>
        <label className="label-optional">任意</label>
        <input
          type="checkbox"
          checked={isVariationEditable}
          onChange={handleCheck}
        />
      </div>

      {/* バリエーション一覧 */}
      <div className="variation-list-wrapper">
        <ItemVariationHeader />

        <div className="variation-rows">
          {variItems.map((item: any, itemIndex: number) => (
            <ItemVariationRow
              key={itemIndex}
              item={item}
              itemIndex={itemIndex}
              isEditable={isVariationEditable && !isDisabled}
              isDisabled={isDisabled}
              onChangeValue={onChangeValue}
              onAdd={addNewVari}
              onDelete={delButton}
              onFocus={handleFocus}
              onBlur={outForcus}
              showDelete={variItems.length > 1 && isVariationEditable && !isDisabled}
              errorMap={errorMap}
              verticalLines={verticalLines[itemIndex]}
            />
          ))}
        </div>

        {/* エラー表示 */}
        {Object.keys(errors || {})
          .filter(key => key.startsWith('variation_'))
          .map(key => (
            <div key={key} className="form-error variation-error">
              {errors[key]}
            </div>
          ))}
      </div>
    </>
  );
};

