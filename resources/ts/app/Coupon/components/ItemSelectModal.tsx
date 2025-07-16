import React, { useEffect, useState } from 'react';
import axios from 'axios';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (ids: number[]) => void;
  selectedItemIds: number[];
};

type Item = {
  id: number;
  name: string;
};

export const ItemSelectModal: React.VFC<Props> = ({ isOpen, onClose, onConfirm }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [page] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setKeyword('');
    fetchItems(page);
  }, [isOpen, page]);

  const fetchItems = async (page: number, keywordParam = '') => {
    try {
      const res = await axios.get(`/api/coupon/items`, {
        params: {
          page,
          keyword: keywordParam,
        },
      });

      const responseData = res.data;
      setItems(responseData.rows ?? []);
      setTotalPages(responseData.pager?.lastPage ?? 1);
    } catch (error) {
      console.error('商品一覧の取得に失敗:', error);
      setItems([]);
      setTotalPages(1);
    }
  };

  const toggleSelect = (id: number) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-start pt-8 z-50">
      <div className="bg-white overflow-y-auto rounded-xl shadow-lg p-6" style={{ width: '80vw', height: '80vh' }}>
        <h2 className="text-lg font-bold mb-4">商品を選択</h2>

        <div className="flex items-center gap-2 mb-4">
          <div style={{ width: '300px' }}>
            <input
              type="text"
              className="w-full border rounded p-2"
              style={{ boxSizing: 'border-box' }}
              placeholder="商品名・品番で検索"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  fetchItems(1, keyword); // Enterキーで検索実行
                }
              }}
            />
          </div>
          <button
            className="btn"
            onClick={() => fetchItems(1, keyword)}
          >
            検索
          </button>
        </div>

        <ul className="space-y-2 mb-4">
          {items.map(item => (
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
            onClick={() => fetchItems(page - 1, keyword)}
            disabled={page <= 1}
          >
            ＜ 前
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            className="btn-sub"
            onClick={() => fetchItems(page + 1, keyword)}
            disabled={page >= totalPages}
          >
            次 ＞
          </button>
        </div>

        <div className="flex justify-end gap-4">
          <button className="btn" onClick={() => onConfirm(selected)}>決定</button>
          <button className="btn-delete" onClick={() => setSelected([])}>選択リセット</button>
          <button className="btn-delete" onClick={onClose}>キャンセル</button>
        </div>
      </div>
    </div>
  );
};
