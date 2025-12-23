// resources/ts/app/TopImage/components/ImageSelectModal.tsx
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

type ImageItem = { id: number; name: string };
type StagedReturn = { image_id: number; img_url: string; url: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onRegisterSuccess?: () => void;
  deferCommit?: boolean;
  onSelect?: (items: StagedReturn[]) => void;
};

export const ImageSelectModal: React.FC<Props> = ({
  open,
  onClose,
  onRegisterSuccess,
  deferCommit,
  onSelect,
}) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // タブ：参照/アップロード
  const [activeTab, setActiveTab] = useState<'browse' | 'upload'>('browse');

  // アップロード関連
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number>(0);

  // ★追加: 画面幅に応じた per_page（表示件数）を決める
  const [perPage, setPerPage] = useState<number>(12);
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      // 767px以下で「見えなくなる/きつい」なら、ページ内件数を落とす
      if (w <= 767) return 6;
      return 12;
    };
    const apply = () => setPerPage(calc());
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);

  // 背面スクロール停止
  useEffect(() => {
    if (!open) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = orig;
    };
  }, [open]);

  // 初回/ページ変更時に読み込み（参照タブ時のみ）
  useEffect(() => {
    if (open && activeTab === 'browse') fetchImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, page, activeTab, perPage]);

  const fetchImages = async () => {
    try {
      const res = await axios.get('/api/images', {
        params: { search, page, per_page: perPage }, // ★追加
      });
      setImages(res.data?.rows ?? []);
    } catch (e) {
      console.error('画像一覧取得に失敗', e);
      setImages([]);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchImages();
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleRegisterOne = async (image: ImageItem) => {
    try {
      await axios.post('/api/TopImage', { image_id: image.id, url: '' });
      onClose();
      onRegisterSuccess?.();
    } catch (e) {
      console.error('❌ 登録に失敗', e);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const pageIds = useMemo(() => new Set(images.map((i) => i.id)), [images]);
  const selectAllThisPage = () =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      images.forEach((i) => next.add(i.id));
      return next;
    });
  const clearAllThisPage = () =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      images.forEach((i) => next.delete(i.id));
      return next;
    });

  const handleConfirmSelect = () => {
    if (!deferCommit) return;
    const selected: StagedReturn[] = images
      .filter((img) => selectedIds.has(img.id))
      .map((img) => ({ image_id: img.id, img_url: `/images/${img.name}`, url: '' }));
    onSelect?.(selected);
    setSelectedIds(new Set());
    onClose();
  };

  if (!open) return null;

  const isThisPageFullySelected = images.length > 0 && images.every((i) => selectedIds.has(i.id));
  const selectedCount = Array.from(selectedIds).filter((id) => pageIds.has(id)).length;

  const uploadFiles = async (files: File[]) => {
    if (!files.length) return;

    const imageFiles = files.filter(isImageFile);
    const skipped = files.length - imageFiles.length;

    if (imageFiles.length === 0) {
      alert('画像ファイルが見つかりませんでした。JPG/PNG/WebP/GIF を選択してください。');
      return;
    }
    if (skipped > 0) {
      console.log(`[upload] 非画像 ${skipped} 件はスキップしました`);
    }

    const CHUNK = 10;
    const chunks: File[][] = [];
    for (let i = 0; i < imageFiles.length; i += CHUNK) {
      chunks.push(imageFiles.slice(i, i + CHUNK));
    }

    setUploading(true);
    setProgress(0);

    try {
      for (let ci = 0; ci < chunks.length; ci++) {
        const chunk = chunks[ci];
        const form = new FormData();
        chunk.forEach((f) => form.append('files[]', f));

        await axios.post('/api/images/upload', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            if (!e.total) return;
            const base = (ci / chunks.length) * 100;
            const part = (e.loaded / e.total) * (100 / chunks.length);
            setProgress(Math.min(100, Math.round(base + part)));
          },
        });
      }

      setActiveTab('browse');
      await fetchImages();
    } catch (e) {
      console.error('アップロードに失敗', e);
      alert('アップロードに失敗しました。ファイル形式・サイズ・件数をご確認ください。');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files: File[] = [];
    if (e.dataTransfer.items) {
      for (const item of Array.from(e.dataTransfer.items)) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    } else if (e.dataTransfer.files) {
      for (const f of Array.from(e.dataTransfer.files)) files.push(f);
    }
    await uploadFiles(files);
  };
  const onDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };
  const onDragLeave: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const isImageFile = (f: File) =>
    f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif)$/i.test(f.name);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto">
      <div className="min-h-[100dvh] flex items-start sm:items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded shadow-lg w-full max-w-screen-lg overflow-hidden flex flex-col
                        h-[calc(100dvh-1rem)] sm:h-[88vh] max-h-[calc(100dvh-1rem)] sm:max-h-[88vh]">
          <div className="shrink-0 bg-white border-b px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-base sm:text-lg font-bold">画像を選択</h2>
              <div className="flex rounded bg-gray-100">
                <button
                  className={`px-3 py-1 text-sm rounded-l ${activeTab === 'browse' ? 'bg-white border' : ''}`}
                  onClick={() => setActiveTab('browse')}
                >
                  参照
                </button>
                <button
                  className={`px-3 py-1 text-sm rounded-r ${activeTab === 'upload' ? 'bg-white border' : ''}`}
                  onClick={() => setActiveTab('upload')}
                >
                  アップロード
                </button>
              </div>
            </div>
            <button className="btn btn-danger btn-sm" onClick={onClose}>
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeTab === 'browse' ? (
              <>
                <div className="px-4 sm:px-6 py-3 bg-white border-b">
                  <div className="flex gap-2">
                    <input
                      className="input w-full"
                      placeholder="画像名で検索"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    <button className="btn" onClick={handleSearch}>
                      検索
                    </button>
                  </div>
                </div>

                {deferCommit && (
                  <div className="px-4 sm:px-6 py-2 text-sm flex items-center justify-between">
                    <div className="flex gap-2">
                      <button className="btn btn-outline btn-xs" onClick={selectAllThisPage}>
                        このページを全選択
                      </button>
                      <button className="btn btn-outline btn-xs" onClick={clearAllThisPage}>
                        このページの選択を解除
                      </button>
                    </div>
                    <div>{isThisPageFullySelected ? '（このページは全て選択中）' : '（一部のみ選択中）'}</div>
                  </div>
                )}

                <div className="px-4 sm:px-6 pb-4">
                  {/* ★任意: 小さい幅で列数を落として“縦に伸びすぎ”を抑制 */}
                  <div className="image-picker__grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {images.map((img) => {
                      const isSelected = selectedIds.has(img.id);
                      return (
                        <div
                          key={img.id}
                          className={`image-picker__card border rounded p-2 ${
                            deferCommit ? 'cursor-pointer hover:bg-gray-50' : 'hover:bg-gray-50'
                          } flex flex-col`}
                          style={{ minHeight: 200 }}
                          onClick={deferCommit ? () => toggleSelect(img.id) : undefined}
                        >
                          <div
                            className="image-picker__thumb bg-white border border-gray-200 rounded grid place-items-center overflow-hidden w-full"
                            style={{ aspectRatio: '16/9' }}
                          >
                            <img
                              src={`/images/${img.name}`}
                              alt={img.name}
                              className="block"
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
                              }}
                            />
                          </div>

                          <div
                            className="image-picker__caption text-center break-all overflow-hidden"
                            style={{
                              marginTop: '0.35rem',
                              fontSize: '.8125rem',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              minHeight: '2.2em',
                            }}
                          >
                            {img.name}
                          </div>

                          <div className="image-picker__actions mt-auto pt-1 flex justify-center">
                            {deferCommit ? (
                              <label className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelect(img.id)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                選択
                              </label>
                            ) : (
                              <button className="btn btn-sm" onClick={() => handleRegisterOne(img)}>
                                追加
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="px-4 sm:px-6 py-6">
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
                    dragOver ? 'bg-blue-50 border-blue-400' : 'border-gray-300'
                  }`}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                >
                  <p className="mb-3">ここに画像ファイルやフォルダをドラッグ＆ドロップ</p>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <label className="btn btn-outline cursor-pointer">
                      ファイルを選択
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={async (e) => {
                          const files = e.target.files ? Array.from(e.target.files) : [];
                          await uploadFiles(files);
                          e.currentTarget.value = '';
                        }}
                      />
                    </label>
                    <label className="btn btn-outline cursor-pointer">
                      フォルダを選択
                      <input
                        type="file"
                        // @ts-ignore
                        webkitdirectory="true"
                        directory=""
                        multiple
                        className="hidden"
                        onChange={async (e) => {
                          const files = e.target.files ? Array.from(e.target.files) : [];
                          await uploadFiles(files);
                          e.currentTarget.value = '';
                        }}
                      />
                    </label>
                  </div>

                  {uploading && (
                    <div className="mt-6">
                      <div className="w-full bg-gray-200 rounded h-3 overflow-hidden">
                        <div className="bg-blue-500 h-3" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="text-sm mt-2">{progress}%</div>
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-500 mt-4">
                  対応形式: JPG/PNG/WebP/GIF 等（ブラウザが認識できるもの）・サイズ上限はサーバ設定に依存します。
                </p>
              </div>
            )}
          </div>

          <div className="shrink-0 bg-white border-t px-4 sm:px-6 py-3 flex items-center justify-between">
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={activeTab !== 'browse'}
              title={activeTab === 'browse' ? '' : '参照タブで利用できます'}
            >
              前へ
            </button>

            {deferCommit ? (
              <button
                className="btn btn-primary"
                disabled={activeTab !== 'browse' || selectedIds.size === 0}
                onClick={handleConfirmSelect}
                title={activeTab === 'browse' ? '' : '参照タブで利用できます'}
              >
                決定（選択 {selectedCount} 件）
              </button>
            ) : (
              <span className="text-sm">ページ: {activeTab === 'browse' ? page : '-'}</span>
            )}

            <button
              className="btn btn-outline btn-sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={activeTab !== 'browse'}
              title={activeTab === 'browse' ? '' : '参照タブで利用できます'}
            >
              次へ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
