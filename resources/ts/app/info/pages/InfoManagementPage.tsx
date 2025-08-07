import React, { useState, useEffect } from 'react';

type InfoItem = {
  id: number;
  published_at: string;
  title: string;
  body: string;
};

export const InfoManagementPage: React.FC = () => {
  const [tab, setTab] = useState<'topics' | 'items'>('topics');

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="mb-4 flex gap-4">
        <button
          className={`px-4 py-2 rounded ${tab === 'topics' ? 'bg-yellow-400' : 'bg-gray-200'}`}
          onClick={() => setTab('topics')}
        >
          ショップ情報
        </button>
        <button
          className={`px-4 py-2 rounded ${tab === 'items' ? 'bg-yellow-400' : 'bg-gray-200'}`}
          onClick={() => setTab('items')}
        >
          商品情報
        </button>
      </div>
      <div className="bg-white rounded-lg p-6 shadow-md">
        <InfoList type={tab} />
      </div>
    </div>
  );
};

const InfoList: React.FC<{ type: 'topics' | 'items' }> = ({ type }) => {
  const [items, setItems] = useState<InfoItem[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [draft, setDraft] = useState<InfoItem>({
    id: 0,
    published_at: '',
    title: '',
    body: '',
  });
  const apiBase = `/api/info/${type === 'topics' ? 'topics' : 'item-topics'}`;

  // データ取得
  const fetchData = async () => {
    const res = await fetch(apiBase);
    const json = await res.json();
    setItems(Array.isArray(json) ? json : json.data ?? []);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [type]);

  // 新規 or 編集
  const handleSave = async () => {
    if (!draft.title || !draft.published_at || !draft.body) {
      alert('日付・タイトル・内容は必須です');
      return;
    }
    if (editId) {
      // 更新
      await fetch(`${apiBase}/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
    } else {
      // 新規
      await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
    }
    await fetchData();
    setEditId(null);
    setDraft({ id: 0, published_at: '', title: '', body: '' });
  };

  const handleEdit = (item: InfoItem) => {
    setEditId(item.id);
    setDraft(item);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('本当に削除しますか？')) {
      await fetch(`${apiBase}/${id}`, { method: 'DELETE' });
      await fetchData();
      if (editId === id) {
        setEditId(null);
        setDraft({ id: 0, published_at: '', title: '', body: '' });
      }
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">{type === 'topics' ? 'ショップ情報' : '商品情報'}</h2>
      <table className="w-full border mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">日付</th>
            <th className="p-2">タイトル</th>
            <th className="p-2">内容</th>
            <th className="p-2 w-24">操作</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} className={editId === item.id ? 'bg-yellow-100' : ''}>
              <td className="p-2">{item.published_at}</td>
              <td className="p-2">{item.title}</td>
              <td className="p-2">{item.body}</td>
              <td className="p-2">
                <button
                  className="text-blue-500 underline mr-2"
                  onClick={() => handleEdit(item)}
                >編集</button>
                <button
                  className="text-red-500 underline"
                  onClick={() => handleDelete(item.id)}
                >削除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* 新規追加・編集フォーム */}
      <div className="flex gap-2 mb-2">
        <input
          type="date"
          className="border rounded px-2 py-1"
          value={draft.published_at}
          onChange={e => setDraft({ ...draft, published_at: e.target.value })}
        />
        <input
          type="text"
          className="border rounded px-2 py-1"
          placeholder="タイトル"
          value={draft.title}
          onChange={e => setDraft({ ...draft, title: e.target.value })}
        />
        <input
          type="text"
          className="border rounded px-2 py-1 w-64"
          placeholder="内容"
          value={draft.body}
          onChange={e => setDraft({ ...draft, body: e.target.value })}
        />
        <button
          className="bg-yellow-400 hover:bg-yellow-500 px-4 py-1 rounded"
          onClick={handleSave}
        >
          {editId ? '更新' : '新規追加'}
        </button>
        {editId && (
          <button
            className="text-gray-500 underline"
            onClick={() => {
              setEditId(null);
              setDraft({ id: 0, published_at: '', title: '', body: '' });
            }}
          >キャンセル</button>
        )}
      </div>
    </div>
  );
};
