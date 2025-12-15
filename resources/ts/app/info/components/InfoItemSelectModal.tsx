// resources/ts/app/info/components/InfoItemSelectModal.tsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';

// 商品1件分の型
export type InfoItem = {
  id: number;
  name: string;
  code?: string;
  category_name?: string;
};

// カテゴリの型（APIから id が返る前提）
export type InfoCategory = {
  id: number;
  name: string;
  code?: string;
};

export type InfoItemSelectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (item: InfoItem | null) => void;
  initialSelectedId?: number | null;
};

export const InfoItemSelectModal: React.VFC<InfoItemSelectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialSelectedId,
}) => {
  const PER_PAGE = 8;

  const [items, setItems] = useState<InfoItem[]>([]);
  const [categories, setCategories] = useState<InfoCategory[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(initialSelectedId ?? null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [keyword, setKeyword] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');

  useEffect(() => {
    if (!isOpen) return;

    setKeyword('');
    setCategoryId('');
    setPage(1);
    setSelectedId(initialSelectedId ?? null);

    fetchCategories();
    fetchItems(1, '', '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/info/categories');
      const data = res.data;
      const rows: InfoCategory[] = Array.isArray(data) ? data : data?.rows ?? [];
      setCategories(rows);
    } catch (error) {
      console.error('カテゴリ一覧の取得に失敗:', error);
      setCategories([]);
    }
  };

  const fetchItems = async (
    pageArg: number,
    keywordArg: string = keyword,
    categoryArg: number | '' = categoryId,
  ) => {
    try {
      const res = await axios.get('/api/info/items', {
        params: {
          page: pageArg,
          per_page: PER_PAGE,
          keyword: keywordArg || undefined,
          category_id: categoryArg === '' ? undefined : categoryArg,
        },
      });

      const data = res.data;
      const rows: InfoItem[] = data.rows ?? data.data ?? (Array.isArray(data) ? data : []);
      setItems(rows);
      setTotalPages(data.pager?.lastPage ?? data.lastPage ?? 1);
      setPage(pageArg);
    } catch (error) {
      console.error('商品一覧の取得に失敗:', error);
      setItems([]);
      setTotalPages(1);
    }
  };

  const handleSelect = (id: number) => setSelectedId(id);

  const handleConfirm = () => {
    const selected = items.find((x) => x.id === selectedId) ?? null;
    onConfirm(selected);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-start pt-6 z-50">
      <div
        className="bg-white rounded-xl shadow-lg p-6 flex flex-col"
        style={{ width: '86vw', height: '88vh' }}
      >
        <h2 className="text-lg font-bold mb-4 shrink-0">商品を選択</h2>

        {/* 検索条件 */}
        <div className="flex flex-wrap items-center gap-2 mb-4 shrink-0">
          <div style={{ width: '240px' }}>
            <select
              className="w-full border rounded p-2 text-sm"
              value={categoryId === '' ? '' : String(categoryId)}
              onChange={(e) => {
                const v = e.target.value;
                const next = v === '' ? '' : Number(v);
                setCategoryId(next);
                fetchItems(1, keyword, next);
              }}
            >
              <option value="">すべてのカテゴリ</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ width: '320px' }}>
            <input
              type="text"
              className="w-full border rounded p-2 text-sm"
              placeholder="商品名・品番で検索"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  fetchItems(1, keyword, categoryId);
                }
              }}
            />
          </div>

          <button className="btn" onClick={() => fetchItems(1, keyword, categoryId)}>
            検索
          </button>

          <div className="ml-auto text-xs text-gray-500">1ページ {PER_PAGE} 件表示</div>
        </div>

        {/* 一覧（必要な場合だけスクロール） */}
        <div className="flex-1 min-h-0 overflow-auto">
          <ul className="space-y-1 border rounded">
            {items.map((item) => {
              const isSelected = selectedId === item.id;
              return (
                <li
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`flex items-center justify-between border-b last:border-b-0 py-2 cursor-pointer hover:bg-gray-100 px-3 ${
                    isSelected ? 'bg-yellow-100' : ''
                  }`}
                >
                  <div className="flex flex-col text-sm min-w-0">
                    <span className="font-medium truncate">{item.name}</span>
                    <span className="text-xs text-gray-500 truncate">
                      {item.code ? `品番: ${item.code}` : ''}
                      {item.category_name ? ` / カテゴリ: ${item.category_name}` : ''}
                    </span>
                  </div>
                  <input
                    type="radio"
                    checked={isSelected}
                    readOnly
                    className="cursor-pointer ml-3"
                    onClick={(e) => e.stopPropagation()}
                  />
                </li>
              );
            })}

            {items.length === 0 && (
              <li className="py-6 text-center text-sm text-gray-500">
                該当する商品がありません
              </li>
            )}
          </ul>
        </div>

        {/* ページング */}
        <div className="flex justify-between items-center mt-4 text-sm shrink-0">
          <button
            className="btn-sub"
            onClick={() => fetchItems(page - 1, keyword, categoryId)}
            disabled={page <= 1}
          >
            ＜ 前
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            className="btn-sub"
            onClick={() => fetchItems(page + 1, keyword, categoryId)}
            disabled={page >= totalPages}
          >
            次 ＞
          </button>
        </div>

        {/* フッター */}
        <div className="flex justify-end gap-4 mt-4 pt-4 border-t shrink-0">
          <button
            className="btn"
            onClick={handleConfirm}
            disabled={!selectedId}
            title={!selectedId ? '商品を選択してください' : ''}
          >
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
