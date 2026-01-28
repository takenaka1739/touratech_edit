// 更新: resources/ts/app/PickupRanking/components/ItemSelectModal.tsx
// 変更点:
// - MultipleSelectModal を廃止
// - 画像のように「選択」リンクで 1 件のみ選択するモーダルに変更
// - 単価/国内国外在庫は表示しない（品番・商品名のみ）

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

type Row = {
  id: number;
  item_number?: string;
  code?: string;
  name?: string;
};

type Pager = {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;

  // 単一選択
  onConfirm: (id: number | null) => void;
  selectedItemId: number | null;
};

export const ItemSelectModal: React.VFC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedItemId,
}) => {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [pager, setPager] = useState<Pager>({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 20,
  });
  const [error, setError] = useState<string | null>(null);

  const perPage = pager.per_page;

  const fetchRows = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/pickup_ranking/items', {
        params: {
          page,
          per_page: perPage,
          keyword: keyword || undefined,
        },
      });

      const data = res?.data;
      if (!data?.success) {
        setRows([]);
        setPager({
          current_page: 1,
          last_page: 1,
          total: 0,
          per_page: perPage,
        });
        setError(data?.message || '商品一覧の取得に失敗しました。');
        return;
      }

      setRows(Array.isArray(data.rows) ? data.rows : []);
      setPager({
        current_page: Number(data?.pager?.current_page ?? page) || page,
        last_page: Number(data?.pager?.last_page ?? 1) || 1,
        total: Number(data?.pager?.total ?? 0) || 0,
        per_page: Number(data?.pager?.per_page ?? perPage) || perPage,
      });
    } catch (e: any) {
      setRows([]);
      setError('商品一覧の取得に失敗しました。（/api/pickup_ranking/items）');
    } finally {
      setLoading(false);
    }
  };

  // オープン時に初期化して1ページ目を表示
  useEffect(() => {
    if (!isOpen) return;
    setKeyword('');
    setRows([]);
    setError(null);
    setPager(p => ({ ...p, current_page: 1 }));
    fetchRows(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const displayRangeText = useMemo(() => {
    const total = pager.total ?? 0;
    if (!total) return '0';
    const from = (pager.current_page - 1) * pager.per_page + 1;
    const to = Math.min(pager.current_page * pager.per_page, total);
    return `${from} - ${to} / ${total}`;
  }, [pager]);

  const goPage = (p: number) => {
    const last = pager.last_page || 1;
    const next = Math.max(1, Math.min(p, last));
    fetchRows(next);
  };

  const clear = () => {
    setKeyword('');
    fetchRows(1);
  };

  const search = () => {
    fetchRows(1);
  };

  const handlePick = (id: number) => {
    onConfirm(id);
    onClose();
  };

  if (!isOpen) return null;

  const last = pager.last_page || 1;
  const cur = pager.current_page || 1;

  // ページボタン: 現在±2を出す
  const pageNumbers = [];
  for (let p = Math.max(1, cur - 2); p <= Math.min(last, cur + 2); p++) {
    pageNumbers.push(p);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded shadow-lg w-11/12 max-w-5xl mt-10"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center">
          <div className="font-bold">商品検索</div>
          <button className="btn ml-auto" type="button" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Search Area */}
        <div className="p-4 border-b">
          <div className="flex items-end">
            <div className="flex-grow">
              <div className="form-group py-2">
                <label className="label mr-2">文字列</label>
                <div className="flex-grow">
                  <input
                    className="input w-full"
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') search();
                    }}
                    placeholder="品番 / 商品名 / コード"
                    maxLength={100}
                  />
                </div>
              </div>
            </div>

            <div className="ml-2">
              <button className="btn" type="button" onClick={search} disabled={loading}>
                {loading ? '検索中...' : '検索'}
              </button>
            </div>

            <div className="ml-2">
              <button className="btn" type="button" onClick={clear} disabled={loading}>
                クリア
              </button>
            </div>
          </div>

          {error && <div className="bg-red-200 py-2 px-4 text-sm mt-2">{error}</div>}
        </div>

        {/* List */}
        <div className="p-4">
          <table className="table w-full">
            <thead>
              <tr>
                <th>品番・商品名</th>
                <th className="w-24">選択</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={2} className="text-center py-6 text-sm text-gray-500">
                    該当データがありません。
                  </td>
                </tr>
              )}

              {rows.map(r => {
                const n = r.item_number ?? r.code ?? '';
                const name = r.name ?? '';
                const selected = selectedItemId !== null && Number(selectedItemId) === Number(r.id);

                return (
                  <tr key={r.id} className={selected ? 'bg-yellow-50' : ''}>
                    <td>
                      <div className="text-xs text-gray-600">{n}</div>
                      <div>{name}</div>
                    </td>
                    <td className="col-btn">
                      <button
                        type="button"
                        className="underline text-blue-600"
                        onClick={() => handlePick(Number(r.id))}
                      >
                        選択
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pager */}
          <div className="flex items-center mt-3">
            <div className="flex items-center">
              <button className="btn px-2 py-1" type="button" onClick={() => goPage(1)} disabled={cur <= 1 || loading}>
                «
              </button>
              <button className="btn ml-1 px-2 py-1" type="button" onClick={() => goPage(cur - 1)} disabled={cur <= 1 || loading}>
                ‹
              </button>

              {pageNumbers.map(p => (
                <button
                  key={p}
                  className={p === cur ? 'btn ml-1 px-2 py-1 bg-yellow-300' : 'btn ml-1 px-2 py-1'}
                  type="button"
                  onClick={() => goPage(p)}
                  disabled={loading}
                >
                  {p}
                </button>
              ))}

              <button className="btn ml-1 px-2 py-1" type="button" onClick={() => goPage(cur + 1)} disabled={cur >= last || loading}>
                ›
              </button>
              <button className="btn ml-1 px-2 py-1" type="button" onClick={() => goPage(last)} disabled={cur >= last || loading}>
                »
              </button>
            </div>

            <div className="ml-auto text-sm text-gray-700">{displayRangeText}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemSelectModal;
