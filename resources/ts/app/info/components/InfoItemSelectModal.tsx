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

// カテゴリの型
export type InfoCategory = {
  code: string;
  name: string;
};

// モーダルに渡す props
export type InfoItemSelectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (item: InfoItem | null) => void;
  initialSelectedId?: number | null;
};

/**
 * InfoItemSelectModal
 * - 単一商品選択モーダル
 * - カテゴリ & キーワードで絞り込み
 * - 決定時に選択中の商品1件（または null）を onConfirm に返す
 */
export const InfoItemSelectModal: React.VFC<InfoItemSelectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialSelectedId,
}) => {
  const [items, setItems] = useState<InfoItem[]>([]);
  const [categories, setCategories] = useState<InfoCategory[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(
    initialSelectedId ?? null,
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [categoryCode, setCategoryCode] = useState<string>('');

  // モーダルが開かれたタイミングで初期化＋取得
  useEffect(() => {
    if (!isOpen) return;

    setKeyword('');
    setCategoryCode('');
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
      const rows: InfoCategory[] = Array.isArray(data)
        ? data
        : data?.rows ?? [];
      setCategories(rows);
    } catch (error) {
      console.error('カテゴリ一覧の取得に失敗:', error);
      setCategories([]);
    }
  };

  const fetchItems = async (
    pageArg: number,
    keywordArg: string = keyword,
    categoryArg: string = categoryCode,
  ) => {
    try {
      const res = await axios.get('/api/info/items', {
        params: {
          page: pageArg,
          keyword: keywordArg || undefined,
          category: categoryArg || undefined,
        },
      });

      const data = res.data;
      const rows: InfoItem[] =
        data.rows ?? data.data ?? (Array.isArray(data) ? data : []);
      setItems(rows);
      setTotalPages(data.pager?.lastPage ?? 1);
      setPage(pageArg);
    } catch (error) {
      console.error('商品一覧の取得に失敗:', error);
      setItems([]);
      setTotalPages(1);
    }
  };

  const handleSelect = (id: number) => {
    setSelectedId(id);
  };

  const handleConfirm = () => {
    const selected = items.find((x) => x.id === selectedId) ?? null;
    onConfirm(selected);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-start pt-8 z-50">
      <div
        className="bg-white overflow-y-auto rounded-xl shadow-lg p-6"
        style={{ width: '80vw', height: '80vh' }}
      >
        <h2 className="text-lg font-bold mb-4">商品を選択</h2>

        {/* 検索条件（カテゴリ + キーワード） */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div style={{ width: '220px' }}>
            <select
              className="w-full border rounded p-2 text-sm"
              value={categoryCode}
              onChange={(e) => {
                const v = e.target.value;
                setCategoryCode(v);
                fetchItems(1, keyword, v);
              }}
            >
              <option value="">すべてのカテゴリ</option>
              {categories.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ width: '280px' }}>
            <input
              type="text"
              className="w-full border rounded p-2 text-sm"
              style={{ boxSizing: 'border-box' }}
              placeholder="商品名・品番で検索"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  fetchItems(1, keyword, categoryCode); // Enterキーで検索実行
                }
              }}
            />
          </div>
          <button
            className="btn"
            onClick={() => fetchItems(1, keyword, categoryCode)}
          >
            検索
          </button>
        </div>

        {/* 商品一覧 */}
        <ul className="space-y-1 mb-4 border rounded">
          {items.map((item) => {
            const isSelected = selectedId === item.id;
            return (
              <li
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`flex items-center justify-between border-b last:border-b-0 py-1 cursor-pointer hover:bg-gray-100 px-2 ${
                  isSelected ? 'bg-yellow-100' : ''
                }`}
              >
                <div className="flex flex-col text-sm">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-xs text-gray-500">
                    {item.code ? `品番: ${item.code}` : ''}
                    {item.category_name
                      ? ` / カテゴリ: ${item.category_name}`
                      : ''}
                  </span>
                </div>
                <input
                  type="radio"
                  checked={isSelected}
                  readOnly
                  className="cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
              </li>
            );
          })}
          {items.length === 0 && (
            <li className="py-4 text-center text-sm text-gray-500">
              該当する商品がありません
            </li>
          )}
        </ul>

        {/* ページング */}
        <div className="flex justify-between items-center mb-4 text-sm">
          <button
            className="btn-sub"
            onClick={() => fetchItems(page - 1, keyword, categoryCode)}
            disabled={page <= 1}
          >
            ＜ 前
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            className="btn-sub"
            onClick={() => fetchItems(page + 1, keyword, categoryCode)}
            disabled={page >= totalPages}
          >
            次 ＞
          </button>
        </div>

        {/* フッターボタン */}
        <div className="flex justify-end gap-4">
          <button className="btn" onClick={handleConfirm}>
            決定
          </button>
          <button
            className="btn-delete"
            onClick={() => {
              setSelectedId(null);
            }}
          >
            選択リセット
          </button>
          <button className="btn-delete" onClick={onClose}>
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
};
