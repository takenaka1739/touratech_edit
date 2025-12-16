// resources/ts/app/info/components/InfoItemSelectModal.tsx

import React from 'react';
import axios from 'axios';
import {
  SingleSelectModal,
  type SingleSelectRow,
  type SingleSelectCategory,
  type SingleSelectFetchResult,
} from '@/components/SingleSelectModal';

// 商品1件分（外部に返す型）
export type InfoItem = {
  id: number;
  name: string;
  code?: string;
  category_name?: string | null;
};

export type InfoItemSelectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (item: InfoItem | null) => void;
  initialSelectedId?: number | null;
};

/**
 * InfoItemSelectModal
 *
 * - SingleSelectModal のラッパー
 * - 商品検索 API / カテゴリ API をここで束ねる
 */
export const InfoItemSelectModal: React.VFC<InfoItemSelectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialSelectedId,
}) => {
  /**
   * カテゴリ取得
   */
  const fetchCategories = async (): Promise<SingleSelectCategory[]> => {
    const res = await axios.get('/api/info/categories');
    const rows = res.data?.rows ?? [];

    return rows.map((c: any) => ({
      id: c.id,
      name: c.name,
    }));
  };

  /**
   * 商品取得
   */
  const fetchRows = async (params: {
    page: number;
    perPage: number;
    keyword: string;
    categoryId: number | null;
  }): Promise<SingleSelectFetchResult> => {
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
      rows: (data.rows ?? []).map((row: any): SingleSelectRow => ({
        id: row.id,
        title: row.name,
        subTitle: [
          row.code ? `品番: ${row.code}` : null,
          row.category_name ? `カテゴリ: ${row.category_name}` : null,
        ]
          .filter(Boolean)
          .join(' / '),
      })),
      pager: data.pager,
    };
  };

  return (
    <SingleSelectModal
      isOpen={isOpen}
      title="商品を選択"
      initialSelectedId={initialSelectedId}
      perPage={8}
      categoryLabel="カテゴリ"
      onFetchCategories={fetchCategories}
      fetchRows={fetchRows}
      onClose={onClose}
      onConfirm={(row) => {
        if (!row) {
          onConfirm(null);
          return;
        }

        // SingleSelectRow → InfoItem に変換
        onConfirm({
          id: row.id,
          name: row.title,
        });
      }}
    />
  );
};
