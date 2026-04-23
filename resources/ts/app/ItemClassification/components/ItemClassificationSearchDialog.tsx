import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { ItemClassification } from '@/types';
import { TableWrapper, BoxConditions, DialogWrapper, Forms } from '@/components';
import { useCommonSearchDialog } from '@/app/App/uses/useCommonSearchDialog';
import { useComposing } from '@/uses';

type ItemClassificationSearchDialogProps = {
  isShown: boolean;
  onSelected: (props: ItemClassification) => void;
  onSelectedMultiple?: (props: ItemClassification[]) => void;
  onCancel: () => void;
  excludeIds?: number[];
  rowIndex?: number;
  currentCategoryId?: number | null;
};

type ItemClassificationSearchDialogConditionsState = {
  c_keyword?: string;
  page: number;
};

/**
 * 商品分類マスタ（検索）画面 Component
 *
 * - 単体選択
 * - チェックボックスによる複数選択
 */
export const ItemClassificationSearchDialog: React.VFC<ItemClassificationSearchDialogProps> = ({
  isShown,
  onSelected,
  onSelectedMultiple,
  onCancel,
  excludeIds = [],
  currentCategoryId = null,
}) => {
  const {
    state,
    conditions,
    isLoading,
    onChange,
    onClickSearchButton,
    onClickClearButton,
    onChangePage,
    onClickCancel,
  } = useCommonSearchDialog<ItemClassificationSearchDialogConditionsState, ItemClassification>(
    {
      c_keyword: '',
      page: 1,
    },
    '/api/item_classification/dialog',
    isShown,
    onSelected,
    onCancel
  );

  const { composing, onCompositionStart, onCompositionEnd } = useComposing();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    if (!isShown) {
      setSelectedIds([]);
      return;
    }

    if (currentCategoryId != null) {
      setSelectedIds([currentCategoryId]);
      return;
    }

    setSelectedIds([]);
  }, [isShown, currentCategoryId]);

  const filteredRows = useMemo(() => {
    return state.rows.filter((r: ItemClassification) => r.id != null && !excludeIds.includes(r.id));
  }, [state.rows, excludeIds]);

  const allVisibleIds = useMemo(() => {
    return filteredRows
      .map((r: ItemClassification) => r.id)
      .filter((id): id is number => id != null);
  }, [filteredRows]);

  const isAllChecked = useMemo(() => {
    return allVisibleIds.length > 0 && allVisibleIds.every(id => selectedIds.includes(id));
  }, [allVisibleIds, selectedIds]);

  const toggleChecked = useCallback((id: number, checked: boolean) => {
    setSelectedIds(prev => {
      if (checked) {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      }

      return prev.filter(x => x !== id);
    });
  }, []);

  const toggleAllChecked = useCallback(
    (checked: boolean) => {
      if (checked) {
        const merged = Array.from(new Set([...selectedIds, ...allVisibleIds]));
        setSelectedIds(merged);
        return;
      }

      if (currentCategoryId != null) {
        setSelectedIds([currentCategoryId]);
        return;
      }

      setSelectedIds([]);
    },
    [allVisibleIds, selectedIds, currentCategoryId]
  );

  const handleSingleSelect = useCallback(
    (item: ItemClassification) => {
      onSelected(item);
      setSelectedIds([]);
      onCancel();
    },
    [onSelected, onCancel]
  );

  const handleMultipleSelect = useCallback(() => {
    if (!onSelectedMultiple || selectedIds.length === 0) {
      return;
    }

    const selectedItems = filteredRows.filter(
      (r: ItemClassification) => r.id != null && selectedIds.includes(r.id)
    );

    onSelectedMultiple(selectedItems);
    setSelectedIds([]);
    onCancel();
  }, [onSelectedMultiple, selectedIds, filteredRows, onCancel]);

  const tables = useMemo(() => {
    const tbody = filteredRows.map(r => {
      const checked = r.id != null && selectedIds.includes(r.id);

      return (
        <tr key={r.id}>
          <td className="w-12 text-center">
            {r.id != null && (
              <input
                type="checkbox"
                checked={checked}
                onChange={e => toggleChecked(r.id as number, e.target.checked)}
              />
            )}
          </td>
          <td>
            <span className="link" onClick={() => handleSingleSelect(r)}>
              {r.name}
            </span>
          </td>
          <td className="col-btn">
            <button
              type="button"
              className="btn-link"
              onClick={() => handleSingleSelect(r)}
            >
              選択
            </button>
          </td>
        </tr>
      );
    });

    return (
      <table>
        <thead>
          <tr>
            <th className="w-12 text-center">
              <input
                type="checkbox"
                checked={isAllChecked}
                onChange={e => toggleAllChecked(e.target.checked)}
              />
            </th>
            <th>商品分類名</th>
            <th className="col-btn">選択</th>
          </tr>
        </thead>
        <tbody>{tbody}</tbody>
      </table>
    );
  }, [filteredRows, selectedIds, isAllChecked, toggleChecked, toggleAllChecked, handleSingleSelect]);

  return (
    <DialogWrapper
      title="商品分類検索"
      isShown={isShown && !isLoading}
      onClickCancel={onClickCancel}
    >
      <BoxConditions
        onClickSearchButton={onClickSearchButton}
        onClickClearButton={onClickClearButton}
      >
        <Forms.FormGroupInputText
          labelText="文字列"
          name="c_keyword"
          value={conditions.c_keyword}
          onChange={onChange}
          onCompositionStart={onCompositionStart}
          onCompositionEnd={onCompositionEnd}
          onKeyDown={e => {
            if (e.key === 'Enter' && !composing) {
              onClickSearchButton();
            }
          }}
          maxLength={30}
          groupClassName="max-w-sm"
          removeOptionalLabel
        />
      </BoxConditions>

      <div className="mb-2 flex justify-end">
        <button
          type="button"
          className="btn"
          onClick={handleMultipleSelect}
          disabled={!onSelectedMultiple || selectedIds.length === 0}
        >
          チェックした分類を追加
        </button>
      </div>

      <TableWrapper pager={state.pager} onChangePage={onChangePage} isLoading={isLoading}>
        {tables}
      </TableWrapper>
    </DialogWrapper>
  );
};