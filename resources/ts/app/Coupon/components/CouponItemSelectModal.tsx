// 更新: resources/ts/app/Coupon/components/CouponItemSelectModal.tsx

import React from 'react';
import axios from 'axios';
import {
  MultipleSelectModal,
  type MultipleSelectRow,
  type MultipleSelectFetchResult,
  type MultipleSelectCategory,
} from '@/components/MultipleSelectModal';

type Props = {
  isOpen: boolean;
  selectedItemIds: number[];
  onClose: () => void;
  onConfirm: (itemIds: number[]) => void;
};

export const CouponItemSelectModal: React.VFC<Props> = ({
  isOpen,
  selectedItemIds,
  onClose,
  onConfirm,
}) => {
  const fetchCategories = async (): Promise<MultipleSelectCategory[]> => {
    const res = await axios.get('/api/info/categories');
    const rows = res.data?.rows ?? [];
    return rows.map((c: any) => ({ id: c.id, name: c.name }));
  };

  const fetchRows = async (params: {
    page: number;
    perPage: number;
    keyword: string;
    categoryId: number | null;
  }): Promise<MultipleSelectFetchResult> => {
    const res = await axios.get('/api/info/items', {
      params: {
        page: params.page,
        per_page: params.perPage,
        keyword: params.keyword || undefined,
        category_id: params.categoryId ?? undefined,
      },
    });

    const data = res.data;
    return {
      rows: (data.rows ?? []).map((row: any): MultipleSelectRow => ({
        id: row.id,
        title: row.name,
        subTitle: [
          row.code ? `品番: ${row.code}` : null,
          row.category_name ? `カテゴリ: ${row.category_name}` : null,
        ].filter(Boolean).join(' / '),
      })),
      pager: data.pager,
    };
  };

  return (
    <MultipleSelectModal
      isOpen={isOpen}
      title="商品を選択（複数可）"
      initialSelectedIds={selectedItemIds}
      perPage={8}
      categoryLabel="カテゴリ"
      onFetchCategories={fetchCategories}
      fetchRows={fetchRows}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
};
