// resources/ts/app/TopImage/pages/TopImageListPage.tsx
import React, { useEffect } from 'react';
import { PageWrapper } from '@/components';
import { ImageSelectModal } from '../components/ImageSelectModal';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { useTopImageListPage } from '../uses/useTopImageListPage';

const TopImageListPage: React.FC = () => {
  const title = 'スライドショーマスタ';
  const slug = 'TopImage';

  const {
    fetchSlideItems,

    isModalOpen,
    setModalOpen,
    stagedItems,
    setStagedItems,
    previewItemsState,
    togglingIdx,
    isPublishing,

    move,
    removeAt,
    toggleMarkDelete,
    togglePreviewEnabled,
    handleSave,

    sliderSettings,
    setPreviewItemsState,
  } = useTopImageListPage();

  useEffect(() => {
    fetchSlideItems();
  }, []);

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
            onClick={handleSave}
          >
            保存
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
                      {/* 番号バッジ */}
                      <div className="top-preview-media" style={{ position: 'relative' }}>
                        <div
                          className="absolute top-2 left-2 w-6 h-6 rounded-full grid place-items-center text-white text-xs font-bold"
                          style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1 }}
                          title={`${i + 1}枚目`}
                        >
                          {i + 1}
                        </div>

                        {/* 画像 */}
                        <div style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
                          {p.src ? (
                            <img
                              src={p.src}
                              alt={`preview-${i}`}
                              onError={() => console.warn('[Image load error]', p.src)}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                display: 'block',
                              }}
                            />
                          ) : (
                            <div className="w-full h-full grid place-items-center text-xs text-gray-500">
                              読込中…
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 新規 or 登録済み */}
                      <div className="mt-2 text-sm text-gray-600 break-all">
                        {p.persisted ? '登録済み' : '(新規プレビュー)'}
                      </div>

                      {/* URL 入力（IME 完全対応版） */}
                      <div className="mt-2">
                        <input
                          className="input w-full"
                          placeholder="リンク先URL（任意）"
                          value={p.localUrl ?? ''}   // ← IME 対応：localUrl を使う
                          onChange={(e) => {
                            const v = e.target.value;

                            // localUrl を更新（IME 未確定文字が消えない）
                            setPreviewItemsState((prev) =>
                              prev.map((item, idx2) =>
                                idx2 === i ? { ...item, localUrl: v } : item
                              )
                            );

                            // 新規の場合は stagedItems にも反映
                            if (!p.persisted) {
                              setStagedItems((prev) =>
                                prev.map((s) =>
                                  s.image_id === p.image_id ? { ...s, url: v } : s
                                )
                              );
                            }
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
                          disabled={isBusy}
                        >
                          {isBusy ? '更新中…' : p.is_enabled ? '表示中' : '非表示'}
                        </button>
                      </div>

                      {/* 操作ボタン */}
                      <div className="mt-2 flex gap-2">
                        <button className="btn btn-sm" onClick={() => move(i, i - 1)}>↑</button>
                        <button className="btn btn-sm" onClick={() => move(i, i + 1)}>↓</button>

                        {isNew ? (
                          <button className="btn btn-danger btn-sm" onClick={() => removeAt(i)}>
                            削除
                          </button>
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

      {/* 画像選択モーダル */}
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
