import React from 'react';
import { ItemCategoryRow } from '@/app/Item/components/category';
import { ItemClassificationSearchDialog } from '@/app/ItemClassification/components/ItemClassificationSearchDialog';

type Props = {
  state: any;
  changeCategoryIndex: number | null;

  onChangeCategory: (index: number) => void;
  onDeleteCategory: (index: number) => void;
  addNewCategory: () => void;

  itemClassSearchDialogProps: any;
};

/**
 * 商品マスタの「商品分類」セクション。
 *
 * - 商品分類
 * - 商品分類行（ItemCategoryRow）
 * - 商品分類追加ボタン
 * - 商品分類検索ダイアログ
 */
export const ItemCategorySection: React.VFC<Props> = ({
  state,
  changeCategoryIndex,
  onChangeCategory,
  onDeleteCategory,
  addNewCategory,
  itemClassSearchDialogProps,
}) => {
  return (
    <div style={{ display: 'flex', marginTop: '6px' }}>
      <div style={{ width: '790px', display: 'flex' }}>
        {/* ラベル */}
        <div style={{ display: 'flex', marginTop: '8px', marginLeft: '60px' }}>
          <label>商品分類</label>
          <label className="label-required">必須</label>
        </div>

        {/* カテゴリ行 */}
        <div>
          {state.categoryList
            .map((item: any, originalIndex: number) => ({ ...item, originalIndex }))
            .filter((item: any) => item.status !== 'del')
            .map((item: any) => (
              <ItemCategoryRow
                key={item.originalIndex}
                item={item}
                isDuplicate={item.originalIndex === changeCategoryIndex}
                onChangeCategory={onChangeCategory}
                onDeleteCategory={onDeleteCategory}
                showDelete={
                  state.categoryList.filter((i: any) => i.status !== 'del').length >= 2
                }
              />
            ))}
        </div>
      </div>

      {/* カテゴリ追加 */}
      <button
        className="category-plus-button"
        style={{ marginLeft: '10px' }}
        onClick={addNewCategory}
      >
        ＋
      </button>

      {/* 商品分類検索ダイアログ */}
      <ItemClassificationSearchDialog {...itemClassSearchDialogProps} />
    </div>
  );
};
