/**
 * 商品分類
 *
 * 商品マスタに紐づくカテゴリ情報
 */
export type ItemCategory = {
    combId: number | undefined;
    categoryId: number | null;
    name: string;
    status: string;
    initialcategoryId: number | undefined;
  };