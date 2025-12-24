// resources/ts/app/TopImage/uses/useTopImageListPage.ts
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { TopImage as BaseTopImage } from '@/types/TopImage';

export type TopImageRow = BaseTopImage & {
  image_name?: string;
  image_url?: string;
  sort_order: number;
  is_published?: boolean;
  is_enabled?: boolean;
  url?: string;
};

export const useTopImageListPage = () => {
  const [slideItems, setSlideItems] = useState<TopImageRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSlideItems = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('/api/TopImage');
      const rows = (res.data as TopImageRow[]).map((row) => ({
        ...row,
        is_enabled: row.is_published ?? false,
      }));
      setSlideItems(rows);
    } finally {
      setIsLoading(false);
    }
  };

  const [isModalOpen, setModalOpen] = useState(false);
  const [stagedItems, setStagedItems] = useState<any[]>([]);
  const [markedForDelete, setMarkedForDelete] = useState<number[]>([]);
  const [previewItemsState, setPreviewItemsState] = useState<any[]>([]);
  const [togglingIdx, setTogglingIdx] = useState<number | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // プレビュー再構築
  useEffect(() => {
    setPreviewItemsState((prevState) => {
      const existing = slideItems.map((it) => {
        const prev = prevState.find((p) => p.image_id === it.image_id);
        return {
          id: it.id,
          image_id: it.image_id,
          src: it.image_url || '',
          persisted: true,
          markedForDelete: markedForDelete.includes(it.id),
          is_enabled: it.is_enabled ?? true,
          url: it.url ?? '',
          localUrl: prev?.localUrl ?? it.url ?? '', // ← IME 対応
        };
      });

      const staged = stagedItems.map((s) => {
        const prev = prevState.find((p) => p.image_id === s.image_id);
        return {
          image_id: s.image_id,
          src: s.img_url,
          persisted: false,
          is_enabled: true,
          url: s.url ?? '',
          localUrl: prev?.localUrl ?? s.url ?? '', // ← IME 対応
        };
      });

      return [...existing, ...staged];
    });
  }, [slideItems, stagedItems, markedForDelete]);

  // 並び替え
  const move = (from: number, to: number) => {
    setPreviewItemsState((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const copy = [...prev];
      const [m] = copy.splice(from, 1);
      copy.splice(to, 0, m);
      return copy;
    });
  };

  // 削除
  const removeAt = (idx: number) => {
    const target = previewItemsState[idx];
    setPreviewItemsState((prev) => prev.filter((_, i) => i !== idx));
    if (!target.persisted) {
      setStagedItems((prev) =>
        prev.filter((s) => s.image_id !== target.image_id)
      );
    }
  };

  // 削除マーク
  const toggleMarkDelete = (id: number) => {
    setMarkedForDelete((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // 表示/非表示トグル
  const togglePreviewEnabled = async (idx: number) => {
    const target = previewItemsState[idx];
    if (!target) return;

    setPreviewItemsState((prev) =>
      prev.map((p, i) =>
        i === idx ? { ...p, is_enabled: !p.is_enabled } : p
      )
    );

    if (!target.persisted || !target.id) return;

    let timer: NodeJS.Timeout | null = setTimeout(() => {
      setTogglingIdx(idx);
    }, 300);

    try {
      await axios.patch(`/api/TopImage/${target.id}/toggle`);
      await fetchSlideItems();
    } finally {
      if (timer) clearTimeout(timer);
      setTogglingIdx((cur) => (cur === idx ? null : cur));
    }
  };

  // 登録
  const handlePublish = async () => {
    if (!previewItemsState.length) return;
    setIsPublishing(true);

    try {
      const items = previewItemsState
        .filter((p) => !p.markedForDelete)
        .map((p, order) => ({
          id: p.persisted ? p.id : undefined,
          image_id: p.persisted ? undefined : p.image_id,
          is_enabled: p.is_enabled ?? true,
          url: p.localUrl.trim() || null,   // ← localUrl を使用
          sort_order: order + 1,
        }));

      await axios.post('/api/TopImage/sync', { items });
      await fetchSlideItems();
      setStagedItems([]);
      setMarkedForDelete([]);
    } finally {
      setIsPublishing(false);
    }
  };

  const sliderSettings = useMemo(
    () => ({
      dots: true,
      infinite: false,
      arrows: true,
      speed: 350,
      slidesToShow: 3,
      slidesToScroll: 1,
    }),
    []
  );

  return {
    slideItems,
    isLoading,
    fetchSlideItems,

    isModalOpen,
    setModalOpen,
    stagedItems,
    setStagedItems,
    markedForDelete,
    previewItemsState,
    setPreviewItemsState,
    togglingIdx,
    isPublishing,

    move,
    removeAt,
    toggleMarkDelete,
    togglePreviewEnabled,
    handlePublish,

    sliderSettings,
  };
};
