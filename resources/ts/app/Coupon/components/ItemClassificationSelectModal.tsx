// resources/ts/app/Coupon/components/ItemClassificationSelectModal.tsx

import React from 'react';
import axios from 'axios';
import {
  MultipleSelectModal,
  type MultipleSelectFetchResult,
  type MultipleSelectRow,
} from '@/components/MultipleSelectModal';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (ids: number[]) => void;
  selectedCategoryIds: number[];
};

export const ItemClassificationSelectModal: React.VFC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedCategoryIds,
}) => {
  const fetchRows = async (params: {
    page: number;
    perPage: number;
    keyword: string;
    categoryId: number | null; // 未使用（MultipleSelectModal のシグネチャ都合）
  }): Promise<MultipleSelectFetchResult> => {
    const res = await axios.get('/api/coupon/item-classifications', {
      params: {
        page: params.page,
        per_page: params.perPage,
        keyword: params.keyword || undefined,
      },
    });

    const data = res.data;

    return {
      rows: (data.rows ?? []).map((row: any): MultipleSelectRow => ({
        id: row.id,
        title: row.name,
        subTitle: null,
      })),
      pager: data.pager,
    };
  };

  return (
    <MultipleSelectModal
      isOpen={isOpen}
      title="商品分類を選択（複数可）"
      initialSelectedIds={selectedCategoryIds ?? []}
      perPage={8}
      fetchRows={fetchRows}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
};
