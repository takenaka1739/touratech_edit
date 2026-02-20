import { useState, useEffect } from 'react';

type UseItemVariationArgs = {
  state: any;
  setState: React.Dispatch<React.SetStateAction<any>>;
  onClickDelete: () => void;
  errors?: Record<string, string>;
  setErrors: React.Dispatch<any>;
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
 * - 保存時バリデーション（赤枠用 errorMap）
 */
export const useItemVariation = ({ state, setState, onClickDelete, errors, setErrors }: UseItemVariationArgs) => {

  // ==============================================================
  // 初期化（variItems / backVariItems / imageList）
  // ==============================================================
  useEffect(() => {
    if (!Array.isArray(state.variItems)) {
      setState((prev: any) => ({
        ...prev,
        variItems: [['', '', '', '', '', '', '', '1']],
        backVariItems: [['', '', '', '', '', '', '', '1']],
        imageList: [['']],
      }));
      return;
    }

    const needsFix = state.variItems.some(
      (row: any) =>
        !Array.isArray(row) ||
        row.length < 8 ||
        row.some((col: any) => col === undefined)
    );

    if (needsFix) {
      const fixed = state.variItems.map((row: any, rowIndex: number) => {
        if (!Array.isArray(row)) return ['', '', '', '', '', '', '', '1'];

        return Array.from({ length: 8 }).map((_, i) => {
          const v = row[i];

          // 初期行のみ（rowIndex === 0）
          if (rowIndex === 0) {
            if (i >= 1 && i <= 4) return v ?? '';
            if (i === 5 || i === 6) return v ?? '';
            if (i === 7) return v ?? '1';
            return v === undefined ? null : v;
          }

          // 2 行目以降は null を保持
          if (i >= 1 && i <= 4) return v === undefined ? null : v;

          // 品番・価格（index 5,6）
          if (i === 5 || i === 6) return v ?? '';

          // 公開フラグ (index7)
          if (i === 7) return v ?? '0';

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
    : [['', '', '', '', '', '', '', '']];

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
      state.variItems[0][1] &&
      state.variItems[0][1] !== '' &&
      (state.isVariationEditable === undefined || state.isVariationEditable === null)
    ) {
      setState((prev: any) => ({
        ...prev,
        isVariationEditable: true,
      }));
    }
  }, [state?.id, state?.variItems, state?.isVariationEditable, setState]);

  // ==============================================================
  // 保存時バリデーション（赤枠用 errorMap）
  // ==============================================================
  const [errorMap, setErrorMap] = useState<boolean[][]>([]);

  const hasNoVariation =
    Array.isArray(variItems) &&
    variItems.every((row, rowIndex) => {
      // バリ1〜4 がすべて null or ''
      const allVariEmpty = [1, 2, 3, 4].every(col => {
        return row[col] === null || row[col] === '';
      });

      // 1行目は「完全空」でもOK（入力中のため）
      if (rowIndex === 0) return allVariEmpty;

      // 2行目以降は品番・価格も空でなければならない
      const noSku = row[5] === null || row[5] === '';
      const noPrice = row[6] === null || row[6] === '';

      return allVariEmpty && noSku && noPrice;
    });

  // errors → errorMap 変換
  useEffect(() => {
    if (!errors) return;

    if (hasNoVariation) {
      setErrorMap([]);
      return;
    }

    const newErrorMap = variItems.map(() => Array(7).fill(false));

    variItems.forEach((row, rowIndex) => {
      const rowErrors = newErrorMap[rowIndex];

      // 品番・価格は必須
      if (row[5] === '' || row[5] === null) rowErrors[5] = true;
      const price = Number(row[6]);
      if (row[6] === '' || row[6] === null || Number.isNaN(price) || price >= 100000000) rowErrors[6] = true;

      // null 以外の先頭は入力必須
      const firstCol = [1, 2, 3, 4].find(col => row[col] !== null);
      if (firstCol !== undefined && row[firstCol] === '') {
        rowErrors[firstCol] = true;
      }

      // 穴あき禁止（同一行内）
      let seenValue = false;
      for (let col = 1; col <= 4; col++) {
        if (row[col] !== null && row[col] !== '') {
          seenValue = true;
        } else if (row[col] === '') {
          const hasValueLater = [col + 1, col + 2, col + 3, col + 4]
            .filter(c => c <= 4)
            .some(c => row[c] !== null && row[c] !== '');
          if (seenValue && hasValueLater) rowErrors[col] = true;
        }
      }
    });

    // 分岐点の未入力チェック
    const getFirstInputCol = (row: any[]) => {
      const col = [1, 2, 3, 4].find(c => row[c] !== null);
      return col ?? 1;
    };

    for (let i = 0; i < variItems.length; i++) {
      const firstInputCol_i = getFirstInputCol(variItems[i]);
      const checkFlags = [false, false, false, false];

      for (let j = i + 1; j < variItems.length; j++) {
        const firstInputCol_j = getFirstInputCol(variItems[j]);

        // 次の要素のチェックに進む
        if (firstInputCol_j <= firstInputCol_i) break;

        // チェック済、または紐づきのないインデックスはスキップ
        const firstTrueIndex = checkFlags.indexOf(true);
        const limitCol = firstTrueIndex === -1 ? 5 : firstTrueIndex + 1;
        if (firstInputCol_j >= limitCol) continue;

        // 未入力判定対象に追加
        const idx = firstInputCol_j - 1;
        if (!checkFlags[idx]) checkFlags[idx] = true;
      }

      // checkFlags が true の位置で i 行が空欄ならエラー
      for (let col = 1; col <= 4; col++) {
        if (checkFlags[col - 1] && variItems[i][col] === '') {
          newErrorMap[i][col] = true;
        }
      }
    }

    // 品番（col=5）の重複チェック
    const skuMap = new Map<string, number[]>();

    variItems.forEach((row, rowIndex) => {
      const sku = row[5] as string | null;
      if (sku && sku.trim() !== "") {
        if (!skuMap.has(sku)) {
          skuMap.set(sku, []);
        }
        skuMap.get(sku)!.push(rowIndex);
      }
    });

    // 同じ品番が2行以上ある場合、全ての該当行にエラーを付ける
    for (const rows of Array.from(skuMap.values()) as number[][]) {
      if (rows.length >= 2) {
        rows.forEach(r => {
          newErrorMap[r][5] = true;
        });
      }
    }

    setErrorMap(newErrorMap);
  }, [errors, variItems, hasNoVariation]);

  // ==============================================================
  // バリエーション行追加
  // ==============================================================
  const addNewVari = (selectRow: number, selectIndex: number) => {
    setvariClickFlag(true);

    let variArr = [null, null, null, null, null, '', '', '1'];
    let imgArr = ['', {}];

    for (let i = selectIndex; i <= 4; i++) variArr[i] = '';

    const baseVariItems = Array.isArray(state.variItems) ? state.variItems : [];
    const newCount = baseVariItems.filter((value: any) => typeof value[0] === 'string' && value[0].includes('new')).length + 1;

    const newId = 'new' + newCount;
    variArr[0] = newId;
    imgArr[0] = newId;
    const backArr = [newId, null, null, null, null, '', ''];

    const items = Array.isArray(state.variItems) ? state.variItems : [];
    let insertIndex = selectRow + 1;

    while (insertIndex < items.length) {
      const cell = items[insertIndex][selectIndex];
      if (cell !== null && cell !== undefined) break;
      insertIndex++;
    }

    setState((prev: any) => {
      const prevVariItems = Array.isArray(prev.variItems) ? prev.variItems : [];
      const prevBackVariItems = Array.isArray(prev.backVariItems) ? prev.backVariItems : prevVariItems;
      const prevImageList = Array.isArray(prev.imageList)
        ? prev.imageList
        : prevVariItems.map(() => ['']);

      return {
        ...prev,
        variItems: [
          ...prevVariItems.slice(0, insertIndex),
          variArr,
          ...prevVariItems.slice(insertIndex),
        ],
        backVariItems: [
          ...prevBackVariItems.slice(0, insertIndex),
          backArr,
          ...prevBackVariItems.slice(insertIndex),
        ],
        imageList: [
          ...prevImageList.slice(0, insertIndex),
          imgArr,
          ...prevImageList.slice(insertIndex),
        ],
      };
    });
  };

  // ==============================================================
  // バリエーション削除
  // ==============================================================
  const delButton = (deleteIndex: number) => {
    setvariClickFlag(true);

    if (deleteIndex === -1) {
      onClickDelete();
      return;
    }

    setState((prev: any) => {
      const prevVariItems = Array.isArray(prev.variItems) ? prev.variItems : [];
      const prevBackVariItems = Array.isArray(prev.backVariItems) ? prev.backVariItems : prevVariItems;
      const prevImageList = Array.isArray(prev.imageList)
        ? prev.imageList
        : prevVariItems.map(() => ['']);

      // 削除対象の variId
      const deleteVariId = prevVariItems[deleteIndex][0];

      // 削除処理
      const newVariItems = [...prevVariItems];
      const parent = newVariItems[deleteIndex];
      newVariItems.splice(deleteIndex, 1);

      // 継承処理
      if (newVariItems[deleteIndex]) {
        const child = [...newVariItems[deleteIndex]];
        for (let col = 1; col <= 4; col++) {
          if (child[col] === null && parent[col] !== null) {
            child[col] = parent[col];
          }
        }
        newVariItems[deleteIndex] = child;
      }

      // selectIndex 補正
      let newIndex = prev.selectIndex;

      if (deleteIndex === prev.selectIndex) {
        newIndex = Math.max(0, deleteIndex - 1);
      } else if (deleteIndex < prev.selectIndex) {
        newIndex = prev.selectIndex - 1;
      }

      const newSelectId = newVariItems[newIndex]?.[0] ?? null;

      // state.id の補正
      const newStateId =
        prev.id === deleteVariId
          ? newVariItems[0]?.[0] ?? null
          : prev.id;

      return {
        ...prev,

        id: newStateId,

        variItems: newVariItems,

        backVariItems: prevBackVariItems.filter((row: any[]) => row[0] !== deleteVariId),
        imageList: prevImageList.filter((row: any[]) => row[0] !== deleteVariId),
        codeList: prev.codeList?.filter((row: any) => row.id !== deleteVariId),
        categoryListAll: prev.categoryListAll?.filter((obj: any) => !obj[deleteVariId]),
        combIdList: prev.combIdList?.filter((row: any) => row.item_id !== deleteVariId),

        selectIndex: newIndex,
        selectId: newSelectId,
      };
    });

    // 削除リストへの追加
    const target = String(state.variItems?.[deleteIndex]);
    if (typeof target === 'string' && !target.includes('new')) {
      setVariDelItem([...variDelItem, state.variItems[deleteIndex]]);
    }

    // 変更リストから削除行を除外
    const updatedItems = variChangeItem.filter(
      (item: any[]) => item[0] !== variItems[deleteIndex][0]
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
    let value: string;
    if (event.target.type === 'checkbox') {
      value = event.target.checked ? '1' : '0';
    } else {
      value = String(event.target.value);
    }

    setState((prev: any) => ({
      ...prev,
      variItems: prev.variItems.map((row: any, rowIndex: number) =>
        rowIndex === select
          ? row.map((cell: any, colIndex: number) =>
              colIndex === selectIndex ? value : cell === undefined ? '' : cell
            )
          : row
      ),
      backVariItems: prev.backVariItems.map((row: any, rowIndex: number) =>
        rowIndex === select
          ? row.map((cell: any, colIndex: number) =>
              colIndex === selectIndex ? value : cell === undefined ? '' : cell
            )
          : row
      ),
    }));

    if (errors?.variation_1) {
      setErrors((prev: any) => {
        const newErrors = { ...prev };
        delete newErrors.variation_1;

        return newErrors;
      });
    }
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
              targetChangeItem.push(item[index] ?? value);
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
                targetChangeItem.push(item[index] ?? value);
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
    errorMap,
  };
};
