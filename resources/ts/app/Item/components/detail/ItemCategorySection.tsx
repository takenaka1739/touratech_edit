import React from 'react';
import { ItemCategoryRow } from '@/app/Item/components/category';
import { ItemClassificationSearchDialog } from '@/app/ItemClassification/components/ItemClassificationSearchDialog';

type Props = {
  state: any;
  errors: any;
  onDeleteCategory: (index: number) => void;
  addNewCategory: () => void;
  itemClassSearchDialogProps: any;
};

/**
 * 商品マスタの「商品分類」セクション。
 *
 * - 商品分類ラベル
 * - 商品分類行（ItemCategoryRow）
 * - 商品分類追加ボタン
 * - 商品分類検索ダイアログ
 */
export const ItemCategorySection: React.VFC<Props> = ({
  state,
  errors,
  onDeleteCategory,
  addNewCategory,
  itemClassSearchDialogProps,
}) => {

  // ------------------------------------------------------------
  // 除外する分類IDを算出する
  // ------------------------------------------------------------
  const handleOpenCategoryDialog = (rowIndex: number) => {
    // 自分以外の行で選択されている categoryId を収集
    const excludeIds = state.categoryList
      .map((x: any, idx: number) => ({ ...x, idx }))
      .filter((x: { status: string; idx: number }) => x.status !== 'del' && x.idx !== rowIndex)
      .map((x: { categoryId: number | null }) => x.categoryId)
      .filter((id: any) => id != null);

    // ダイアログに渡す props を更新
    itemClassSearchDialogProps.openDialog({
      rowIndex,
      excludeIds,
    });
  };

  // 削除されていないカテゴリ行
  const activeCategories = state.categoryList
    .map((item: any, originalIndex: number) => ({ ...item, originalIndex }))
    .filter((item: any) => item.status !== 'del');

  return (
    <div className="category-section">
      <div className="category-inner">

        {/* ラベル */}
        <div className="category-label">
          <label>商品分類</label>
          <label className="label-required">必須</label>
        </div>

        {/* カテゴリ行 */}
        <div>
          {activeCategories.map((item: any) => (
            <ItemCategoryRow
              key={item.originalIndex}
              item={item}
              isDuplicate={
                item.categoryId != null &&
                state.categoryList.some(
                  (other: any, idx: number) =>
                    idx !== item.originalIndex &&
                    other.status !== 'del' &&
                    other.categoryId === item.categoryId
                )
              }
              isEmptyError={!!errors?.categoryList}
              onChangeCategory={handleOpenCategoryDialog}
              onDeleteCategory={onDeleteCategory}
              showDelete={activeCategories.length >= 2}
            />
          ))}

          {/* エラー表示 */}
          {errors?.categoryList && (
            <div className="form-error category-error">
              {errors.categoryList}
            </div>
          )}
        </div>
      </div>

      {/* カテゴリ追加 */}
      <button
        className="category-plus-button category-add-button"
        onClick={addNewCategory}
      >
        ＋
      </button>

      {/* 商品分類検索ダイアログ */}
      <ItemClassificationSearchDialog
        {...itemClassSearchDialogProps}
        excludeIds={itemClassSearchDialogProps.excludeIds}
        rowIndex={itemClassSearchDialogProps.rowIndex}
      />
    </div>
  );
};
