// resources/ts/app/TopImage/uses/useTopImageListPage.ts
import { useEffect, useState } from 'react';
import { TopImage } from '@/types/TopImage';
import axios from 'axios';

export const useTopImageListPage = () => {
  const [slideItems, setSlideItems] = useState<TopImage[]>([]);

  useEffect(() => {
    fetchSlideItems();
  }, []);

  const fetchSlideItems = async () => {
    try {
      const res = await axios.get('/api/TopImage');
      setSlideItems(res.data);
    } catch (err) {
      console.error('一覧取得に失敗しました', err);
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

  // ✅ 新規追加（仮：後でAPI登録に切り替え）
  const addSlideItem = (item: Omit<TopImage, 'id'> & { id?: number }) => {
    const newItem: TopImage = {
      ...item,
      id: item.id ?? Date.now(), // 仮ID
    };
    setSlideItems((prev) => [...prev, newItem]);
  };

  return {
    slideItems,
    onToggleVisible,
    onDelete,
    addSlideItem,
    fetchSlideItems,
  };
};
