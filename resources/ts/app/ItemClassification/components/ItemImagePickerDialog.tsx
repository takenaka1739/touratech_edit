import React, { useEffect, useMemo, useState, useCallback } from 'react';
import axios from 'axios';

type ImageRow = {
  id: number;
  name: string;
  url?: string | null;
  category_id?: number | null;
  order_by?: number | null;
  created_at?: string | null;
  //  使用中カテゴリ情報（バックで付与済）
  category_name?: string | null;
  category_code?: string | null;
};

type Pager = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type ItemImagePickerDialogProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (img: { id: number; name: string; url?: string | null }) => void;
  title?: string;
  /**  現在編集中のカテゴリID（他カテゴリ使用中チェック用） */
  currentCategoryId?: number;
};

type SortKey = 'id_desc' | 'id_asc' | 'name_asc' | 'name_desc';

export const ItemImagePickerDialog: React.VFC<ItemImagePickerDialogProps> = ({
  open,
  onClose,
  onSelect,
  title = '既存画像から選択',
  currentCategoryId,
}) => {
  const [keyword, setKeyword] = useState('');
  const [rows, setRows] = useState<ImageRow[]>([]);
  const [pager, setPager] = useState<Pager>({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = useMemo(() => rows.find(r => r.id === selectedId) || null, [rows, selectedId]);

  // 並び順＆実ファイルのみ表示（既定ON）
  const [sort, setSort] = useState<SortKey>('id_desc');
  const [onlyWithFile, setOnlyWithFile] = useState<boolean>(true);

  /** いろんなレスポンス形を吸収して、rows と pager を取り出す */
  const normalize = (raw: any): { rows: ImageRow[]; pager: Pager } => {
    const payload = raw?.data ?? raw;

    if (payload && Array.isArray(payload.rows) && payload.pager) {
      const p = payload.pager;
      const pr: Pager = {
        current_page: Number(p.current_page ?? p.currentPage ?? 1),
        last_page: Number(p.last_page ?? p.lastPage ?? 1),
        per_page: Number(p.per_page ?? p.perPage ?? 20),
        total: Number(p.total ?? 0),
      };
      return { rows: payload.rows as ImageRow[], pager: pr };
    }

    if (payload && Array.isArray(payload.data)) {
      const pr: Pager = {
        current_page: Number(payload.current_page ?? 1),
        last_page: Number(payload.last_page ?? 1),
        per_page: Number(payload.per_page ?? 20),
        total: Number(payload.total ?? payload.data.length ?? 0),
      };
      return { rows: payload.data as ImageRow[], pager: pr };
    }

    const arr: ImageRow[] = Array.isArray(payload) ? payload : Array.isArray(payload?.rows) ? payload.rows : [];
    const total = arr.length;
    return {
      rows: arr,
      pager: { current_page: 1, last_page: 1, per_page: total || 20, total },
    };
  };

  const fetchList = useCallback(
    async (page = 1, kw = '') => {
      setLoading(true);
      try {
        const res = await axios.get('/api/item_classification/images', {
          params: {
            page,
            keyword: kw,
            sort,                  // 新しい順 既定
            only_with_file: onlyWithFile ? 1 : 0, // 実ファイルのみ 既定ON
          },
        });

        const n = normalize(res.data);
        setRows(n.rows ?? []);
        setPager(n.pager);
      } catch (e) {
        console.error('❌ 画像一覧の取得に失敗しました', e);
        setRows([]);
        setPager({ current_page: 1, last_page: 1, per_page: 20, total: 0 });
      } finally {
        setLoading(false);
      }
    },
    [sort, onlyWithFile]
  );

  // 開いたらロード、閉じたら初期化
  useEffect(() => {
    if (open) {
      setSelectedId(null);
      fetchList(1, '');
    } else {
      setKeyword('');
      setRows([]);
      setPager({ current_page: 1, last_page: 1, per_page: 20, total: 0 });
    }
  }, [open, fetchList]);

  // 並び順 or 実ファイルのみ切替時は再検索（1ページ目へ）
  useEffect(() => {
    if (open) fetchList(1, keyword.trim());
  }, [sort, onlyWithFile]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSearch = () => fetchList(1, keyword.trim());
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSearch();
  };

  const goPrev = () => {
    if (pager.current_page > 1) fetchList(pager.current_page - 1, keyword.trim());
  };
  const goNext = () => {
    if (pager.current_page < pager.last_page) fetchList(pager.current_page + 1, keyword.trim());
  };

  /** 決定時の確認（他カテゴリで使用中なら警告→はい/いいえ） */
  const handleDecide = () => {
    if (!selected) return;

    const usedElsewhere =
      selected.category_id != null &&
      typeof currentCategoryId === 'number' &&
      selected.category_id !== currentCategoryId;

    if (usedElsewhere) {
      const cname =
        (selected.category_name && selected.category_code)
          ? `${selected.category_name}（${selected.category_code}）`
          : (selected.category_name || selected.category_code || '他のカテゴリ');

      const ok = window.confirm(
        `この画像は「${cname}」で使用中です。\nこのカテゴリに紐付け先を変更しますか？\n\n` +
        `はい：このカテゴリに移動\nいいえ：選び直す`
      );
      if (!ok) return; // キャンセル → そのままモーダル継続
    }

    onSelect({ id: selected.id, name: selected.name, url: selected.url ?? undefined });
    onClose();
  };

  if (!open) return null;

  const styles = {
    overlay: {
      position: 'fixed' as const,
      inset: 0,
      background: 'rgba(0,0,0,0.4)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    },
    container: {
      width: 'min(900px, 95vw)',
      maxHeight: '90vh',
      background: '#fff',
      borderRadius: 8,
      boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column' as const,
    },
    header: {
      padding: '12px 16px',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontWeight: 700,
    },
    body: { padding: '12px 16px', overflow: 'auto' },
    footer: {
      padding: '12px 16px',
      borderTop: '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 },
    card: (active: boolean) => ({
      border: active ? '2px solid #2563eb' : '1px solid #e5e7eb',
      borderRadius: 8,
      padding: 8,
      cursor: 'pointer',
      background: active ? '#eff6ff' : '#fff',
      position: 'relative' as const,
    }),
    thumbWrap: {
      width: '100%',
      aspectRatio: '1 / 1',
      background: '#f3f4f6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 6,
      overflow: 'hidden',
      marginBottom: 6,
    },
    thumb: { width: '100%', height: '100%', objectFit: 'cover' as const },
    filename: { fontSize: 12, wordBreak: 'break-all' as const },
    badge: {
      position: 'absolute' as const,
      top: 8,
      left: 8,
      padding: '2px 6px',
      borderRadius: 9999,
      fontSize: 10,
      background: '#f97316', // orange
      color: '#fff',
    },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.container} onClick={e => e.stopPropagation()}>
        {/* header */}
        <div style={styles.header}>
          <div>{title}</div>
          <button className="btn" onClick={onClose}>× 閉じる</button>
        </div>

        {/* search + options */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              className="form-input w-full max-w-lg"
              placeholder="ファイル名で検索"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button className="btn" onClick={onSearch} disabled={loading}>検索</button>

            <select
              className="form-input"
              value={sort}
              onChange={e => setSort(e.target.value as SortKey)}
              title="並び順"
            >
              <option value="id_desc">新しい順</option>
              <option value="id_asc">古い順</option>
              <option value="name_asc">名前(A→Z)</option>
              <option value="name_desc">名前(Z→A)</option>
            </select>

            <label className="inline-flex items-center ml-2 text-sm">
              <input
                type="checkbox"
                className="mr-1"
                checked={onlyWithFile}
                onChange={e => setOnlyWithFile(e.target.checked)}
              />
              ファイル有りのみ
            </label>
          </div>

          <div className="text-sm text-gray-500 mt-1">
            {loading ? '読み込み中…' : `全 ${pager.total} 件`}
          </div>
        </div>

        {/* body: grid */}
        <div style={styles.body}>
          {rows.length === 0 && !loading ? (
            <div className="text-center text-gray-500 py-10">画像が見つかりませんでした。</div>
          ) : (
            <div style={styles.grid}>
              {rows.map(row => {
                const active = row.id === selectedId;
                const usedText =
                  row.category_name && row.category_code
                    ? `${row.category_name}（${row.category_code}）`
                    : (row.category_name || row.category_code || null);

                return (
                  <div
                    key={row.id}
                    style={styles.card(active)}
                    onClick={() => setSelectedId(row.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setSelectedId(row.id)}
                    aria-label={`画像 ${row.name} を選択`}
                    title={usedText ? `使用中: ${usedText}` : ''}
                  >
                    {usedText && <span style={styles.badge}>使用中</span>}
                    <div style={styles.thumbWrap}>
                      {row.url ? (
                        <img src={row.url} alt={row.name ?? ''} style={styles.thumb} />
                      ) : (
                        <span className="text-gray-400 text-sm">no image</span>
                      )}
                    </div>
                    <div style={styles.filename} title={row.name}>{row.name}</div>
                    {usedText && (
                      <div className="text-[11px] text-gray-500 mt-1" title={usedText}>
                        {usedText}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* footer */}
        <div style={styles.footer}>
          <div className="flex items-center gap-2">
            <button className="btn" onClick={goPrev} disabled={pager.current_page <= 1 || loading}>前へ</button>
            <span className="text-sm text-gray-600">
              {pager.current_page} / {pager.last_page}
            </span>
            <button className="btn" onClick={goNext} disabled={pager.current_page >= pager.last_page || loading}>次へ</button>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn" onClick={onClose}>キャンセル</button>
            <button className="btn-primary" onClick={handleDecide} disabled={!selected || loading}>
              決定
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
