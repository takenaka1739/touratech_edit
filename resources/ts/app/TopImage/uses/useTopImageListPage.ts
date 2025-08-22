// resources/ts/app/TopImage/uses/useTopImageListPage.ts
import { useState } from 'react';
import axios from 'axios';
import { TopImage as BaseTopImage } from '@/types/TopImage';

// API返却に合わせて“ゆるく”型を受ける（フラット or ネストの両対応）
export type TopImageRow = BaseTopImage & {
  // フラットで返る場合
  image_name?: string;
  image_url?: string;
  sort_order: number;
  is_enabled?: boolean;
  url?: string;
  // ネストで返る場合（with('image')）
  image?: {
    id: number;
    name?: string;
    image_name?: string;
  };
};

type CreatePayload = {
  image_id: number;
  sort_order: number;
  is_enabled?: boolean; // ← 追加
  url?: string;         // ← urlは送らないなら削除してOK
};

export const useTopImageListPage = () => {
  const [slideItems, setSlideItems] = useState<TopImageRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSlideItems = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('/api/TopImage');
      const rows: TopImageRow[] = (res.data as TopImageRow[]).map((row) => ({
        ...row,
        is_enabled: row.is_enabled ?? false, // null/undefined を防ぐ
      }));

      setSlideItems(rows);
    } catch (err) {
      console.error('一覧取得に失敗しました', err);
    } finally {
      setIsLoading(false);
    }
  };

  const onToggleVisible = async (id: number) => {
    try {
      await axios.patch(`/api/TopImage/${id}/toggle`);
      setSlideItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_enabled: !item.is_enabled } : item
        )
      );
    } catch (err) {
      console.error('表示切り替えに失敗しました', err);
    }
  };

  const onDelete = async (id: number) => {
    if (!window.confirm('この画像を削除しますか？')) return;
    try {
      await axios.delete(`/api/TopImage/${id}`);
      setSlideItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('削除に失敗しました', err);
    }
  };

const createTopImage = async (data: CreatePayload) => {
  return axios.post('/api/TopImage', data);
};


  const bulkCreateTopImages = async (items: CreatePayload[]) => {
    return axios.post('/api/TopImage/bulk', { items });
  };

  return {
    slideItems,
    isLoading,
    fetchSlideItems,
    onToggleVisible,
    onDelete,
    createTopImage,
    bulkCreateTopImages,
  };
};
