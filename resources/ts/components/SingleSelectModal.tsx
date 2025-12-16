// resources/ts/components/SingleSelectModal.tsx

import React, { useEffect, useMemo, useState } from 'react';

export type SingleSelectCategory = {
  id: number;
  name: string;
};

export type SingleSelectRow = {
  id: number;
  title: string;
  subTitle?: string | null;
};

export type SingleSelectFetchResult = {
  rows: SingleSelectRow[];
  pager: {
    page: number;
    lastPage: number;
    total: number;
  };
};

type Props = {
  isOpen: boolean;
  title: string;

  onClose: () => void;
  onConfirm: (row: SingleSelectRow | null) => void;

  initialSelectedId?: number | null;
  perPage?: number;

  categories?: SingleSelectCategory[];
  categoryLabel?: string;
  onFetchCategories?: () => Promise<SingleSelectCategory[]>;

  fetchRows: (params: {
    page: number;
    perPage: number;
    keyword: string;
    categoryId: number | null;
  }) => Promise<SingleSelectFetchResult>;
};

export const SingleSelectModal: React.VFC<Props> = ({
  isOpen,
  title,
  onClose,
  onConfirm,
  initialSelectedId,
  perPage = 8,
  categories: categoriesProp,
  categoryLabel = 'カテゴリ',
  onFetchCategories,
  fetchRows,
}) => {
  const [keyword, setKeyword] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<SingleSelectCategory[]>(categoriesProp ?? []);
  const [rows, setRows] = useState<SingleSelectRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(initialSelectedId ?? null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const hasCategory = useMemo(
    () => !!onFetchCategories || !!categoriesProp,
    [onFetchCategories, categoriesProp],
  );

  useEffect(() => {
    if (!isOpen) return;

    setKeyword('');
    setCategoryId(null);
    setSelectedId(initialSelectedId ?? null);
    setPage(1);

    (async () => {
      if (onFetchCategories) {
        const cats = await onFetchCategories();
        setCategories(cats);
      }
      await load(1, '', null);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const load = async (p: number, k: string, c: number | null) => {
    const result = await fetchRows({
      page: p,
      perPage,
      keyword: k,
      categoryId: c,
    });

    setRows(result.rows);
    setPage(result.pager.page);
    setLastPage(result.pager.lastPage);
  };

  const handleConfirm = () => {
    const selected = rows.find((x) => x.id === selectedId) ?? null;
    onConfirm(selected);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-start pt-6 z-50">
      <div
        className="bg-white rounded-xl shadow-lg p-6 flex flex-col"
        style={{ width: '86vw', height: '88vh' }}
      >
        <h2 className="text-lg font-bold mb-4">{title}</h2>

        {/* 検索 */}
        <div className="flex gap-2 mb-4 items-center">
          {hasCategory && (
            <select
              className="border rounded p-2 text-sm w-60"
              value={categoryId ?? ''}
              onChange={(e) => {
                const v = e.target.value ? Number(e.target.value) : null;
                setCategoryId(v);
                load(1, keyword, v);
              }}
            >
              <option value="">{`すべての${categoryLabel}`}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          <input
            className="border rounded p-2 text-sm w-80"
            placeholder="キーワード検索"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(1, keyword, categoryId)}
          />

          <button className="btn" onClick={() => load(1, keyword, categoryId)}>
            検索
          </button>
        </div>

        {/* 一覧 */}
        <div className="flex-1 overflow-auto border rounded">
          <ul>
            {rows.map((r) => (
              <li
                key={r.id}
                className={`px-3 py-2 border-b cursor-pointer hover:bg-gray-100 flex justify-between ${
                  selectedId === r.id ? 'bg-yellow-100' : ''
                }`}
                onClick={() => setSelectedId(r.id)}
              >
                <div>
                  <div className="text-sm font-medium">{r.title}</div>
                  {r.subTitle && <div className="text-xs text-gray-500">{r.subTitle}</div>}
                </div>
                <input type="radio" checked={selectedId === r.id} readOnly />
              </li>
            ))}
          </ul>
        </div>

        {/* ページ */}
        <div className="flex justify-between items-center mt-3 text-sm">
          <button className="btn-sub" disabled={page <= 1} onClick={() => load(page - 1, keyword, categoryId)}>
            ＜ 前
          </button>
          <span>{page} / {lastPage}</span>
          <button className="btn-sub" disabled={page >= lastPage} onClick={() => load(page + 1, keyword, categoryId)}>
            次 ＞
          </button>
        </div>

        {/* フッター */}
        <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
          <button className="btn" disabled={!selectedId} onClick={handleConfirm}>
            決定
          </button>
          <button className="btn-delete" onClick={onClose}>
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
};
