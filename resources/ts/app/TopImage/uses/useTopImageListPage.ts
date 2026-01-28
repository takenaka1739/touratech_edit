import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { appAlert } from '@/components';
import { TopImage as BaseTopImage } from '@/types/TopImage';

export type TopImageRow = BaseTopImage & {
  image_name?: string;
  image_url?: string;
  sort_order: number;
  is_published?: boolean;
  url?: string;
};

type PreviewItem = {
  id?: number;
  image_id: number;
  src: string;
  persisted: boolean;
  markedForDelete: boolean;
  is_published: boolean;
  url: string;
  localUrl: string;
  sort_order: number | null;
};

// 差分比較専用の初期状態型
type InitialItem = {
  id: number;
  is_published: boolean;
  sort_order: number | null;
  url: string;
};

export const useTopImageListPage = () => {
  const [slideItems, setSlideItems] = useState<TopImageRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 初期状態をセット済みかどうか
  const [initialized, setInitialized] = useState(false);

  const fetchSlideItems = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('/api/TopImage');
      const rows = (res.data as TopImageRow[]).map((row) => ({
        ...row,
        is_published: row.is_published ?? false,
      }));
      setSlideItems(rows);

      // 次のプレビュー再構築で初期状態をセットし直す
      setInitialized(false);
    } finally {
      setIsLoading(false);
    }
  };

  const [isModalOpen, setModalOpen] = useState(false);
  const [stagedItems, setStagedItems] = useState<any[]>([]);
  const [markedForDelete, setMarkedForDelete] = useState<number[]>([]);
  const [previewItemsState, setPreviewItemsState] = useState<PreviewItem[]>([]);

  // 初期状態は比較専用の型で保持
  const [initialState, setInitialState] = useState<InitialItem[]>([]);

  const [togglingIdx, setTogglingIdx] = useState<number | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // プレビュー再構築
  useEffect(() => {
    const next: PreviewItem[] = (() => {
      const existing: PreviewItem[] = slideItems.map((it) => {
        const prev = previewItemsState.find((p) => p.image_id === it.image_id);
        return {
          id: it.id,
          image_id: it.image_id,
          src: it.image_url || '',
          persisted: true,
          markedForDelete: markedForDelete.includes(it.id),
          is_published: it.is_published ?? false,
          url: it.url ?? '',
          localUrl: prev?.localUrl ?? it.url ?? '',
          sort_order: it.sort_order,
        };
      });

      const staged: PreviewItem[] = stagedItems.map((s) => {
        const prev = previewItemsState.find((p) => p.image_id === s.image_id);
        return {
          image_id: s.image_id,
          src: s.img_url,
          persisted: false,
          markedForDelete: false,
          is_published: true,
          url: s.url ?? '',
          localUrl: prev?.localUrl ?? s.url ?? '',
          sort_order: null,
        };
      });

      return [...existing, ...staged];
    })();

    setPreviewItemsState(next);

    // 初期状態のセットは「initialized が false のときだけ」
    if (!initialized) {
      setInitialState(
        next
          .filter((p) => p.persisted)
          .map((p) => ({
            id: p.id!,
            is_published: p.is_published,
            sort_order: p.sort_order,
            url: p.localUrl,
          }))
      );
      setInitialized(true);
    }

  }, [slideItems, stagedItems, markedForDelete]);

  // 並び替え
  const move = (from: number, to: number) => {
    setPreviewItemsState((prev) => {
      if (to < 0 || to >= prev.length) return prev;

      const copy = [...prev];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);

      return copy.map((item, index) => ({
        ...item,
        sort_order: index + 1,
      }));
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

  // 表示/非表示
  const togglePreviewEnabled = (idx: number) => {
    setPreviewItemsState((prev) =>
      prev.map((p, i) =>
        i === idx ? { ...p, is_published: !p.is_published } : p
      )
    );
  };

  // URL 入力変更
  const handleUrlChange = (i: number, v: string, p: any) => {
    setPreviewItemsState((prev) =>
      prev.map((item, idx2) =>
        idx2 === i ? { ...item, localUrl: v } : item
      )
    );

    if (!p.persisted) {
      setStagedItems((prev) =>
        prev.map((s) =>
          s.image_id === p.image_id ? { ...s, url: v } : s
        )
      );
    }
  };

  // 差分検知
  const isDirty = useMemo(() => {
    if (!initialized) return false;

    const current = previewItemsState.filter(
      (p) => p.persisted && !p.markedForDelete
    );

    if (current.length !== initialState.length) return true;

    const sortedCurrent = [...current].sort((a, b) => a.id! - b.id!);
    const sortedInitial = [...initialState].sort((a, b) => a.id - b.id);

    for (let i = 0; i < sortedInitial.length; i++) {
      const cur = sortedCurrent[i];
      const ini = sortedInitial[i];

      if (cur.localUrl !== ini.url) return true;
      if (cur.is_published !== ini.is_published) return true;
      if (cur.sort_order !== ini.sort_order) return true;
    }

    if (stagedItems.length > 0) return true;
    if (markedForDelete.length > 0) return true;

    return false;
  }, [initialized, initialState, previewItemsState, stagedItems, markedForDelete]);

  // 保存
  const handleSave = async () => {
    if (!previewItemsState.length) return;
    setIsPublishing(true);

    try {
      const items = previewItemsState
        .filter((p) => !p.markedForDelete)
        .map((p, order) => ({
          id: p.persisted ? p.id : undefined,
          image_id: p.persisted ? undefined : p.image_id,
          is_published: p.is_published ?? false,
          url: p.localUrl.trim() || null,
          sort_order: order + 1,
        }));

      await axios.post('/api/TopImage/sync', { items });
      await fetchSlideItems();

      // 保存後に初期化モードへ戻す
      setInitialized(false);

      setStagedItems([]);
      setMarkedForDelete([]);

      appAlert('保存しました。');
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
    handleUrlChange,
    handleSave,

    sliderSettings,
    isDirty,
  };
};
