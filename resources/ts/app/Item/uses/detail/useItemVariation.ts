import { useState, useEffect } from 'react';

type UseItemVariationArgs = {
  state: any;
  setState: React.Dispatch<React.SetStateAction<any>>;
  onClickDelete: () => void;
};

/**
 * 商品マスタの「バリエーション」用フックス。
 * 
 * - バリエーション行の追加
 * - バリエーション行の削除
 * - バリエーション値の変更
 * - フォーカス・フォーカスアウト
 * - バリエーションの状態管理
 * - imageList / backVariItems との同期
 */
export const useItemVariation = ({ state, setState, onClickDelete }: UseItemVariationArgs) => {

  // 新規登録時：state.variItems / backVariItems / imageList を必ず初期化
  useEffect(() => {
    if (!Array.isArray(state.variItems)) {
      setState((prev: any) => ({
        ...prev,
        variItems: [['', '', '', '', '', '', '']],
        backVariItems: [['', '', '', '', '', '', '']],
        imageList: [['']],
      }));
      return;
    }

    const needsFix = state.variItems.some(
      (row: any) =>
        !Array.isArray(row) ||
        row.length < 7 ||
        row.some((col: any) => col === undefined)
    );

    if (needsFix) {
      const fixed = state.variItems.map((row: any, rowIndex: number) => {
        if (!Array.isArray(row)) return ['', '', '', '', '', '', ''];

        return Array.from({ length: 7 }).map((_, i) => {
          const v = row[i];

          // 初期行のみ（rowIndex === 0）
          if (rowIndex === 0) {
            // バリエーション1〜4（index 1〜4）は null → '' に補正
            if (i >= 1 && i <= 4) {
              return v === null || v === undefined ? '' : v;
            }
            // 品番・価格（index 5,6）も null → '' に補正
            if (i === 5 || i === 6) {
              return v === null || v === undefined ? '' : v;
            }
            // id（index 0）はそのまま
            return v === undefined ? null : v;
          }

          // 2 行目以降は null を保持
          if (i >= 1 && i <= 4) {
            return v === undefined ? null : v;
          }

          // 品番・価格（index 5,6）
          if (i === 5 || i === 6) {
            return v === null || v === undefined ? '' : v;
          }

          // id
          return v === undefined ? null : v;
        });
      });

      setState((prev: any) => ({
        ...prev,
        variItems: fixed,
        backVariItems: fixed,
        imageList: Array.isArray(prev.imageList)
          ? prev.imageList
          : fixed.map(() => ['']),
      }));
    }
  }, [state.variItems, setState]);

  const variItems: string[][] = Array.isArray(state.variItems)
    ? state.variItems
    : [['', '', '', '', '', '', '']];

  const [variDelItem, setVariDelItem] = useState<string[][]>([]);
  const [variChangeItem, setVariChangeItem] = useState<string[][]>([]);
  const [variClickFlag, setvariClickFlag] = useState(false);
  const [onFocusItem, setonFocusItem] = useState<string[]>();

  const isVariationEditable: boolean = state.isVariationEditable ?? false;

  // 編集時のみ：variItems のバリエーションに何か入力されていれば true
  useEffect(() => {
    if (
      state?.id &&
      Array.isArray(state?.variItems) &&
      state.variItems.length > 0 &&
      state.variItems[0][1] && state.variItems[0][1] !== '' &&
      (state.isVariationEditable === undefined || state.isVariationEditable === null)
    ) {
      setState((prev: any) => ({
        ...prev,
        isVariationEditable: true,
      }));
    }
  }, [state?.id, state?.variItems, state?.isVariationEditable, setState]);

  // ==============================================================
  // バリエーション行追加
  // ==============================================================
  const addNewVari = (selectRow: number, selectIndex: number) => {
    setvariClickFlag(true);

    let variArr = [null, null, null, null, null, '', ''];
    let imgArr = [''];

    // 押した列より右側は ''（表示）
    for (let i = selectIndex; i <= 4; i++) variArr[i] = '';

    // id を設定
    const baseVariItems = Array.isArray(state.variItems) ? state.variItems : [];
    const newCount = baseVariItems.filter((value: any) => typeof value[0] === 'string' && value[0].includes('new')).length + 1;
    variArr[0] = 'new' + newCount;
    imgArr[0] = 'new' + newCount;

    // 挿入位置の決定
    const items = Array.isArray(state.variItems) ? state.variItems : [];
    let insertIndex = selectRow + 1;

    while (insertIndex < items.length) {
      const cell = items[insertIndex][selectIndex];
      if (cell !== null && cell !== undefined) break;
      insertIndex++;
    }

    setState((prev: any) => ({
      ...prev,
      variItems: [
        ...prev.variItems.slice(0, insertIndex),
        variArr,
        ...prev.variItems.slice(insertIndex),
      ],
      backVariItems: [
        ...prev.backVariItems.slice(0, insertIndex),
        variArr,
        ...prev.backVariItems.slice(insertIndex),
      ],
      imageList: [
        ...prev.imageList.slice(0, insertIndex),
        imgArr,
        ...prev.imageList.slice(insertIndex),
      ],
    }));
  };

  // ==============================================================
  // バリエーション削除
  // ==============================================================
  const delButton = (selectIndex: number) => {
    setvariClickFlag(true);

    if (selectIndex === -1) {
      onClickDelete();
      return;
    }

    setState((prev: any) => ({
      ...prev,
      variItems: prev.variItems.filter((_: any, index: number) => index !== selectIndex),
      imageList: prev.imageList.filter((_: any, index: number) => index !== selectIndex),
    }));

    const target = String(state.variItems?.[selectIndex]);
    if (typeof target === 'string' && !target.includes('new')) {
      setVariDelItem([...variDelItem, state.variItems[selectIndex]]);
    }

    const updatedItems = variChangeItem.filter(
      item => item[0] !== variItems[selectIndex][0]
    );
    setVariChangeItem(updatedItems);
  };

  // ==============================================================
  // バリエーション値変更
  // ==============================================================
  const onChangeValue = (
    event: React.ChangeEvent<HTMLInputElement>,
    select: number,
    selectIndex: number
  ) => {
    setvariClickFlag(true);
    event.persist();

    const value = String(event.target.value);

    setState((prev: any) => ({
      ...prev,
      variItems: prev.variItems.map((row: any, rowIndex: number) =>
        rowIndex === select
          ? row.map((cell: any, colIndex: number) =>
              colIndex === selectIndex
                ? value
                : cell === undefined
                  ? ''
                  : cell
            )
          : row
      ),
      backVariItems: prev.backVariItems.map((row: any, rowIndex: number) =>
        rowIndex === select
          ? row.map((cell: any, colIndex: number) =>
              colIndex === selectIndex
                ? value
                : cell === undefined
                  ? ''
                  : cell
            )
          : row
      ),
    }));
  };

  // ==============================================================
  // フォーカス
  // ==============================================================
  const handleFocus = (item: string[]) => {
    setvariClickFlag(true);
    setonFocusItem(item);
  };

  // ==============================================================
  // フォーカスアウト（バリエーションの差分管理）
  // ==============================================================
  const outForcus = (item: string[]) => {
    setvariClickFlag(true);

    if (!(onFocusItem?.every((value, index) => value === item[index]))) {
      let targetChangeItem: any = [];

      if (variItems.length > 0) {
        const target = variChangeItem.filter(row => row[0] === item[0]);
        const targetIndex = variItems.findIndex(row => row[0] === item[0]) - 1;
        const indexItem = variChangeItem[targetIndex];

        if (target.length > 0 && indexItem) {
          target[0].forEach((value, index) => {
            if (value === null) {
              targetChangeItem.push(indexItem[index]);
            } else {
              const pushValue = item[index] !== null ? item[index] : value;
              targetChangeItem.push(pushValue);
            }
          });

          const deleIndex = variChangeItem.findIndex(row => row[0] === item[0]);
          variChangeItem.splice(deleIndex, 1);
          state.backVariItems.splice(deleIndex, 1);

          setVariChangeItem(changeItem => [...changeItem, targetChangeItem]);
        } else {
          const target2 = variItems.filter(row => row[0] === item[0]);
          const targetIndex2 = variItems.findIndex(row => row[0] === item[0]) - 1;
          const indexItem2 = variItems[targetIndex2];

          if (target2.length > 0 && indexItem2) {
            target2[0].forEach((value, index) => {
              if (value === null) {
                let fallbackValue = indexItem2[index];

                if (fallbackValue === null) {
                  let searchRowIndex = targetIndex2;
                  while (searchRowIndex >= 0) {
                    const previousRow = variItems[searchRowIndex];
                    const candidate = previousRow?.[index];
                    if (candidate !== null && candidate !== undefined) {
                      fallbackValue = candidate;
                      break;
                    }
                    searchRowIndex--;
                  }
                }

                targetChangeItem.push(fallbackValue);
              } else {
                const pushValue = item[index] !== null ? item[index] : value;
                targetChangeItem.push(pushValue);
              }
            });

            setVariChangeItem(changeItem => [...changeItem, targetChangeItem]);
          }
        }
      } else {
        setVariChangeItem(changeItem => [...changeItem, item]);
      }
    }
  };

  return {
    variItems,
    variDelItem,
    variChangeItem,
    setVariChangeItem,
    variClickFlag,
    setvariClickFlag,
    onFocusItem,
    addNewVari,
    delButton,
    onChangeValue,
    handleFocus,
    outForcus,
    isVariationEditable,
  };
};
