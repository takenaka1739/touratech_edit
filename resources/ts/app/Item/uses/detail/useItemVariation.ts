import { useState } from 'react';

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
  const [variItems] = useState<string[][]>([['', '', '', '', '', '', '']]);
  const [variDelItem, setVariDelItem] = useState<string[][]>([]);
  const [variChangeItem, setVariChangeItem] = useState<string[][]>([]);
  const [variClickFlag, setvariClickFlag] = useState(false);
  const [onFocusItem, setonFocusItem] = useState<string[]>();
  const isVariationEditable = state.isVariationEditable ?? false;

  // ==============================================================
  // バリエーション行追加
  // ==============================================================
  const addNewVari = (selectRow: number, selctIndex: number) => {
    setvariClickFlag(true);

    let variArr: any = [null, null, null, null, null, null, null];
    let imgArr: any = [null];

    for (let i = 0; i < variArr.length; i++) {
      if (selctIndex <= i) {
        variArr[i] = '';
      }
    }

    const newCount =
      state.variItems.filter(
        (value: any) => typeof value[0] === 'string' && value[0].includes('new')
      ).length + 1;

    variArr[0] = 'new' + newCount;
    imgArr[0] = 'new' + newCount;

    let insertIndex = selectRow + 1;

    while (
      insertIndex < state.variItems.length &&
      state.variItems[insertIndex][selctIndex] === null
    ) {
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

    const target = String(state.variItems[selectIndex]);
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
              colIndex === selectIndex ? value : cell
            )
          : row
      ),
      backVariItems: prev.backVariItems.map((row: any, rowIndex: number) =>
        rowIndex === select
          ? row.map((cell: any, colIndex: number) =>
              colIndex === selectIndex ? value : cell
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

        if (target.length > 0) {
          target[0].forEach((value, index) => {
            if (value === null) {
              targetChangeItem.push(indexItem[index]);
            } else {
              let pushValue = item[index] !== null ? item[index] : value;
              targetChangeItem.push(pushValue);
            }
          });

          const deleIndex = variChangeItem.findIndex(row => row[0] === item[0]);
          variChangeItem.splice(deleIndex, 1);
          state.backVariItems.splice(deleIndex, 1);

          setVariChangeItem(changeItem => [...changeItem, targetChangeItem]);
        } else {
          const target2 = variItems.filter(row => row[0] === item[0]);
          const targetIndex = variItems.findIndex(row => row[0] === item[0]) - 1;
          const indexItem = variItems[targetIndex];

          if (target2.length > 0) {
            target2[0].forEach((value, index) => {
              if (value === null) {
                let fallbackValue = indexItem[index];

                if (fallbackValue === null) {
                  let searchRowIndex = targetIndex;
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
                let pushValue = item[index] !== null ? item[index] : value;
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
