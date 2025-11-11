// resources/ts/app/TopImage/pages/TopImageListPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { PageWrapper } from '@/components';
import { ImageSelectModal } from '../components/ImageSelectModal';
import { useTopImageListPage, TopImageRow } from '../uses/useTopImageListPage';
import Slider from 'react-slick';
import axios from 'axios';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

type StagedItem = {
  image_id: number;
  img_url: string;
  url: string;
};

type PreviewItem = {
  id?: number;           // DB上のID（persistedのみ）
  image_id: number;
  src: string;
  persisted?: boolean;   // 既存か新規か
  markedForDelete?: boolean;
  is_enabled?: boolean;
  url?: string;
};

const deriveImageSrc = (row: TopImageRow): string => {
  return row.image_url || '';
};

const TopImageListPage: React.FC = () => {
  const title = 'トップ画像マスタ';
  const slug = 'TopImage';

  const {
    slideItems,
    fetchSlideItems,
  } = useTopImageListPage();

  const [isModalOpen, setModalOpen] = useState(false);
  const [stagedItems, setStagedItems] = useState<StagedItem[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [markedForDelete, setMarkedForDelete] = useState<number[]>([]); // 削除予定ID
  const [previewItemsState, setPreviewItemsState] = useState<PreviewItem[]>([]);
  const [togglingIdx, setTogglingIdx] = useState<number | null>(null);  // トグル中インジケータ

  useEffect(() => {
    fetchSlideItems();
  }, []);

  useEffect(() => {
    if (slideItems.length && previewItemsState.length === 0) {
      const existing: PreviewItem[] = slideItems.map((it) => ({
        id: it.id,
        image_id: it.image_id,
        src: deriveImageSrc(it),
        persisted: true,
        markedForDelete: false,
        url: it.url ?? '',
        is_enabled: (it as any).is_enabled ?? true,
      }));
      setPreviewItemsState(existing);
    }
  }, [slideItems]);

  useEffect(() => {
    const existing: PreviewItem[] = slideItems.map((it) => ({
      id: it.id,
      image_id: it.image_id,
      src: deriveImageSrc(it),
      persisted: true,
      markedForDelete: markedForDelete.includes(it.id),
      is_enabled: (it as any).is_enabled ?? true,
      url: it.url ?? '',
    }));
    const staged: PreviewItem[] = stagedItems.map((s) => ({
      image_id: s.image_id,
      src: s.img_url,
      persisted: false,
      is_enabled: true,
      url: s.url ?? '',
    }));
    setPreviewItemsState([...existing, ...staged]);
  }, [slideItems, stagedItems, markedForDelete]);

  const move = (from: number, to: number) => {
    setPreviewItemsState((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const copy = [...prev];
      const [m] = copy.splice(from, 1);
      copy.splice(to, 0, m);
      return copy;
    });
  };

  const removeAt = (idx: number) => {
    setPreviewItemsState((prev) => prev.filter((_, i) => i !== idx));
    setStagedItems((prev) => {
      const target = previewItemsState[idx];
      if (!target) return prev;
      return prev.filter((s) => s.image_id !== target.image_id);
    });
  };

  const toggleMarkDelete = (id: number) => {
    setMarkedForDelete((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ▼ 反映処理（登録）
  const handlePublish = async () => {
    if (!previewItemsState.length) return;
    setIsPublishing(true);
    try {
      const items = previewItemsState
        .filter((p) => !p.markedForDelete)
        .map((p, order) => {
          const base: any = {
            is_enabled: p.is_enabled ?? true,
            url: (p as any).url !== undefined
              ? (String((p as any).url || '').trim() || null)
              : null,
            sort_order: order + 1, // 任意：順序を伝えられるなら付与
          };
          if (p.persisted && p.id) {
            base.id = p.id;
          } else {
            base.image_id = p.image_id;
          }
          return base;
        });

      console.debug('📨 /api/TopImage/sync payload', items);
      await axios.post('/api/TopImage/sync', { items });

      await fetchSlideItems();
      setStagedItems([]);
      setMarkedForDelete([]);
    } finally {
      setIsPublishing(false);
    }
  };

  // ▼ 表示/非表示トグル
  //   - 既存（persisted=true,idあり）: その場で API を叩いて永続化
  //   - 新規プレビュー（persisted=false）: ローカル状態だけ反転（登録で反映）
  const togglePreviewEnabled = async (idx: number) => {
    const target = previewItemsState[idx];
    if (!target) return;

    // 楽観的更新（UI反応を速く）
    setPreviewItemsState((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, is_enabled: !p.is_enabled } : p))
    );

    // 既存は即API保存
    if (target.persisted && target.id) {
      setTogglingIdx(idx);
      try {
        console.debug('🔁 toggle request', { id: target.id });
        await axios.post(`/api/TopImage/${target.id}/toggle`);
        console.debug('✅ toggled on server', { id: target.id });
        // 念のため再取得で整合
        await fetchSlideItems();
      } catch (e) {
        console.error('❌ toggle failed - revert local', e);
        // 失敗時は元に戻す
        setPreviewItemsState((prev) =>
          prev.map((p, i) => (i === idx ? { ...p, is_enabled: !p.is_enabled } : p))
        );
      } finally {
        setTogglingIdx(null);
      }
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
      draggable: true,
      responsive: [
        { breakpoint: 1024, settings: { slidesToShow: 3 } },
        { breakpoint: 768, settings: { slidesToShow: 2 } },
        { breakpoint: 480, settings: { slidesToShow: 1 } },
      ],
    }),
    []
  );

  return (
    <PageWrapper prefix={slug} title={title} breadcrumb={[{ name: title }]}>
      <div className="mb-4 flex gap-6 items-center flex-wrap">
        <button className="btn" onClick={() => setModalOpen(true)}>
          画像を追加
        </button>
        <div className="flex gap-3">
          <button
            className="btn btn-primary"
            disabled={!previewItemsState.length || isPublishing}
            onClick={handlePublish}
          >
            登録
          </button>
          <button
            className="btn"
            disabled={!stagedItems.length || isPublishing}
            onClick={() => setStagedItems([])}
          >
            クリア
          </button>
        </div>
      </div>

      {previewItemsState.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-2">プレビュー</h3>
          <div className="top-preview-slider">
            <Slider {...sliderSettings}>
              {previewItemsState.map((p, i) => {
                const isNew = !p.persisted;
                const isBusy = togglingIdx === i;

                return (
                  <div key={`${p.persisted ? 'e' : 'n'}-${p.image_id}-${i}`} className="px-2">
                    <div
                      className={`border rounded p-2 h-full top-preview-card ${
                        p.markedForDelete ? 'opacity-50 grayscale' : ''
                      }`}
                    >
                      <div className="top-preview-media" style={{ position: 'relative' }}>
                        <div
                          className="absolute top-2 left-2 w-6 h-6 rounded-full grid place-items-center text-white text-xs font-bold"
                          style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1 }}
                          title={`${i + 1}枚目`}
                        >
                          {i + 1}
                        </div>

                        <div style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
                          {p.src ? (
                            <img
                              src={p.src}
                              alt={`preview-${i}`}
                              onError={() => console.warn('[Image load error]', p.src)}
                              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                            />
                          ) : (
                            <div className="w-full h-full grid place-items-center text-xs text-gray-500">
                              読込中…
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 text-sm text-gray-600 break-all">
                        {p.persisted ? '登録済み' : '(新規プレビュー)'}
                      </div>

                      <div className="mt-2">
                        <input
                          className="input w-full"
                          placeholder="リンク先URL（任意）"
                          value={p.url ?? ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            setPreviewItemsState((prev) => {
                              const copy = [...prev];
                              copy[i] = { ...copy[i], url: v };
                              return copy;
                            });
                          }}
                        />
                      </div>

                      {/* 表示/非表示 */}
                      <div className="mt-2">
                        <button
                          className="px-3 py-1 rounded text-sm font-bold disabled:opacity-60"
                          style={{
                            background: '#FFD400',
                            color: '#333',
                            border: '1px solid rgba(0,0,0,.15)',
                            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.4)',
                          }}
                          onClick={() => togglePreviewEnabled(i)}
                          title={p.is_enabled ? '表示中' : '非表示'}
                          disabled={isBusy}
                        >
                          {isBusy ? '更新中…' : (p.is_enabled ? '表示中' : '非表示')}
                        </button>
                      </div>

                      {/* 操作ボタン */}
                      <div className="mt-2 flex gap-2">
                        <button className="btn btn-sm" onClick={() => move(i, i - 1)}>↑</button>
                        <button className="btn btn-sm" onClick={() => move(i, i + 1)}>↓</button>
                        {isNew ? (
                          <button className="btn btn-danger btn-sm" onClick={() => removeAt(i)}>削除</button>
                        ) : (
                          <button
                            className={`btn btn-sm ${p.markedForDelete ? '' : 'btn-danger'}`}
                            onClick={() => toggleMarkDelete(p.id!)}
                          >
                            {p.markedForDelete ? '削除取消' : '削除'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </Slider>
          </div>
        </div>
      )}

      <ImageSelectModal
        open={isModalOpen}
        onClose={() => setModalOpen(false)}
        deferCommit
        onSelect={(items) => {
          setStagedItems((prev) => [...prev, ...items]);
          setModalOpen(false);
        }}
      />
    </PageWrapper>
  );
};

export default TopImageListPage;
