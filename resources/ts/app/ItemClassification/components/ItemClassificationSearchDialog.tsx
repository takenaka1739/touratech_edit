import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { ItemClassification } from '@/types';
import { TableWrapper, BoxConditions, DialogWrapper, Forms } from '@/components';
import { useCommonSearchDialog } from '@/app/App/uses/useCommonSearchDialog';
import { useComposing } from '@/uses';
import { useFlatItemClassification } from '@/app/ItemClassification/uses/useFlatItemClassification';

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
  const PER_PAGE = 20;

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

  const flatRows = useFlatItemClassification(state.rows);

  const pagedRows = useMemo(() => {
    const start = (conditions.page - 1) * PER_PAGE;
    return flatRows.slice(start, start + PER_PAGE);
  }, [flatRows, conditions.page]);

  const pager = useMemo(() => {
    const total = flatRows.length;
    const currentPage = conditions.page;
    const lastPage = Math.max(1, Math.ceil(total / PER_PAGE));

    return {
      total,
      perPage: PER_PAGE,
      currentPage,
      lastPage,
      from: total === 0 ? 0 : (currentPage - 1) * PER_PAGE + 1,
      to: Math.min(total, currentPage * PER_PAGE),
    };
  }, [flatRows.length, conditions.page]);

  const allVisibleIds = useMemo(() => {
    return pagedRows
      .map(r => r.id)
      .filter((id): id is number => id != null && !excludeIds.includes(id));
  }, [pagedRows, excludeIds]);

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

    const selectedItems = flatRows
      .filter(r => r.id != null && selectedIds.includes(r.id))
      .map(r => r as ItemClassification);

    onSelectedMultiple(selectedItems);
    setSelectedIds([]);
    onCancel();
  }, [onSelectedMultiple, selectedIds, flatRows, onCancel]);

  const tables = useMemo(() => {
    const tbody = pagedRows.map(r => {
      const checked = r.id != null && selectedIds.includes(r.id);
      const isExcluded = r.id != null && excludeIds.includes(r.id);
      const isDisplay = Number(r.is_display) === 1;
      const isTop = r.level === 0;
      const isChild = r.level >= 1;

      return (
        <tr
          key={r.id}
          className={
            r.hiddenByParent
              ? 'row-hidden'
              : isChild
              ? 'row-child'
              : undefined
          }
        >
          <td className="w-12 text-center">
            {r.id != null && (
              <input
                type="checkbox"
                checked={checked}
                disabled={isExcluded}
                onChange={e => toggleChecked(r.id as number, e.target.checked)}
              />
            )}
          </td>
          <td>
            <div className="name-cell-wrapper">
              {isChild && <span aria-hidden className="child-guide" />}
              <div className="name-cell">
                <span
                  className="indent"
                  style={{ width: 20 * r.level, minWidth: 20 * r.level }}
                />
                {isTop ? (
                  <span className="icon-parent">P</span>
                ) : (
                  <span className="icon-child">{'↳'.repeat(r.level)}</span>
                )}
                {isExcluded ? (
                  <span className={isTop ? 'name-parent' : 'name-child'}>{r.name}</span>
                ) : (
                  <span
                    className={`link ${isTop ? 'name-parent' : 'name-child'}`}
                    onClick={() => handleSingleSelect(r as ItemClassification)}
                  >
                    {r.name}
                  </span>
                )}
              </div>
            </div>
          </td>
          <td>{r.code ?? ''}</td>
          <td>{isDisplay ? '公開' : '非公開'}</td>
          <td className="col-btn">
            <button
              type="button"
              className="btn-link"
              disabled={isExcluded}
              onClick={() => handleSingleSelect(r as ItemClassification)}
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
            <th>分類コード</th>
            <th>公開設定</th>
            <th className="col-btn">選択</th>
          </tr>
        </thead>
        <tbody>{tbody}</tbody>
      </table>
    );
  }, [pagedRows, selectedIds, excludeIds, isAllChecked, toggleChecked, toggleAllChecked, handleSingleSelect]);

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

      <div className="item-classification-list-page">
        <TableWrapper pager={pager} onChangePage={onChangePage} isLoading={isLoading}>
          {tables}
        </TableWrapper>
      </div>
    </DialogWrapper>
  );
};
