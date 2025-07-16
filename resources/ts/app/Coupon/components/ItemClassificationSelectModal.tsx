import React, { useEffect, useState } from 'react';
import axios from 'axios';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (ids: number[]) => void;
  selectedCategoryIds: number[];
};

type Classification = {
  id: number;
  name: string;
};

export const ItemClassificationSelectModal: React.VFC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedCategoryIds,
}) => {
  const [items, setItems] = useState<Classification[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setKeyword('');
    setSelected(selectedCategoryIds ?? []);
    setPage(1);
    fetchItems(1, '');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    fetchItems(page, keyword);
  }, [page]);

  const fetchItems = async (page: number, keywordParam = '') => {
    try {
      const res = await axios.get('/api/coupon/item-classifications', {
        params: {
          page,
          keyword: keywordParam,
        },
      });
      const responseData = res.data;
      setItems(responseData.rows ?? []);
      setTotalPages(responseData.pager?.lastPage ?? 1);
    } catch (error) {
      console.error('分類一覧の取得に失敗:', error);
      setItems([]);
      setTotalPages(1);
    }
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-start pt-8 z-50">
      <div
        className="bg-white overflow-y-auto rounded-xl shadow-lg p-6"
        style={{ width: '80vw', height: '80vh' }}
      >
        <h2 className="text-lg font-bold mb-4">商品分類を選択</h2>

        <div className="flex items-center gap-2 mb-4">
          <div style={{ width: '300px' }}>
            <input
              type="text"
              className="w-full border rounded p-2"
              placeholder="分類名で検索"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  fetchItems(1, keyword);
                  setPage(1);
                }
              }}
            />
          </div>
          <button className="btn" onClick={() => { setPage(1); fetchItems(1, keyword); }}>
            検索
          </button>
        </div>

        <ul className="space-y-2 mb-4">
           {items.length === 0 && <div>データがありません</div>}
          {items.map((item) => (
            <li
              key={item.id}
              onClick={() => toggleSelect(item.id)}
              className={`flex items-center justify-between border-b py-1 cursor-pointer hover:bg-gray-100 px-2 ${
                selected.includes(item.id) ? 'bg-yellow-100' : ''
              }`}
            >
              <span>{item.name}</span>
              <input
                type="checkbox"
                checked={selected.includes(item.id)}
                readOnly
                className="cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              />
            </li>
          ))}
        </ul>

        <div className="flex justify-between items-center mb-4">
          <button
            className="btn-sub"
            onClick={() => setPage((p) => p - 1)}
            disabled={page <= 1}
          >
            ＜ 前
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            className="btn-sub"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages}
          >
            次 ＞
          </button>
        </div>

        <div className="flex justify-end gap-4">
          <button className="btn" onClick={() => onConfirm(selected)}>
            決定
          </button>
          <button className="btn-delete" onClick={() => setSelected([])}>
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
