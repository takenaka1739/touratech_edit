// resources/ts/app/info/components/InfoPostList.tsx

import React from 'react';
import type { InfoPost } from '@/app/info/pages/InfoManagementPage';

type InfoPostType = 'shop' | 'product';
type InfoPostStatus = 'draft' | 'scheduled' | 'published' | 'archived';

type Props = {
  activeType: InfoPostType;
  posts: InfoPost[];
  selectedId: number | null;
  loading: boolean;
  onRowClick: (post: InfoPost) => void; // ※「編集」ボタン押下時のみ呼ぶ
  onDelete: (post: InfoPost) => void;
  onCreate: () => void;
};

export const InfoPostList: React.FC<Props> = ({
  activeType,
  posts,
  selectedId,
  loading,
  onRowClick,
  onDelete,
  onCreate,
}) => {
  const typeLabel = (type: InfoPostType) => (type === 'shop' ? 'Topics' : 'Items');

  const statusLabel = (status: InfoPostStatus) => {
    switch (status) {
      case 'draft':
        return '下書き';
      case 'scheduled':
        return '予約';
      case 'published':
        return '公開中';
      case 'archived':
        return 'アーカイブ';
      default:
        return status;
    }
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return '';
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return value;
      return d.toLocaleString();
    } catch {
      return value ?? '';
    }
  };

  const rows = Array.isArray(posts) ? posts : [];

  // ★ ヘッダ/本文で「同じpadding・同じ開始位置」を保証するための共通クラス
  const thBase = 'px-3 py-2 text-left align-middle whitespace-nowrap';
  const tdBase = 'px-3 py-2 align-middle';
  const cellWrapLeft = 'flex items-center min-w-0'; // 左揃え用のラッパー

  return (
    <div className="border rounded-md bg-white overflow-hidden relative">
      {/* ヘッダ */}
      <div className="border-b px-3 py-2 text-sm font-semibold flex justify-between items-center">
        <span>{typeLabel(activeType)} 一覧</span>
        <span className="text-xs text-gray-500">件数: {rows.length}</span>
      </div>

      {/* ローディングオーバーレイ */}
      {loading && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 text-xs text-gray-600">
          読み込み中…
        </div>
      )}

      {/* 一覧テーブル */}
      <div className="overflow-auto max-h-[620px]">
        <table className="w-full table-fixed text-xs">
          {/* ★ 列幅を明示して、ヘッダ/本文のズレ要因を排除 */}
          <colgroup>
            <col style={{ width: '110px' }} />
            <col />
            <col style={{ width: '175px' }} />
            <col style={{ width: '80px' }} />
            <col style={{ width: '140px' }} />
          </colgroup>

          <thead className="bg-gray-50">
            <tr className="border-b">
              <th className={thBase}>ステータス</th>
              <th className={thBase}>タイトル</th>
              <th className={thBase}>公開日時</th>
              <th className={`${thBase} text-center`}>ピン留め</th>
              <th className={`${thBase} text-center`}>操作</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 && !loading && (
              <tr>
                <td className="px-3 py-3 text-center text-gray-500" colSpan={5}>
                  データがありません
                </td>
              </tr>
            )}

            {rows.map((p) => (
              <tr
                key={p.id}
                className={`border-b hover:bg-sky-50 ${
                  selectedId === p.id ? 'bg-sky-100' : ''
                }`}
              >
                {/* ステータス */}
                <td className={tdBase}>
                  <div className={cellWrapLeft}>
                    {/* バッジの見た目は維持しつつ、開始位置をヘッダと揃える */}
                    <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] bg-gray-100 whitespace-nowrap">
                      {statusLabel(p.status as InfoPostStatus)}
                    </span>
                  </div>
                </td>

                {/* タイトル */}
                <td className={tdBase}>
                  <div className={cellWrapLeft}>
                    <span className="truncate" title={p.title}>
                      {p.title}
                    </span>
                  </div>
                </td>

                {/* 公開日時 */}
                <td className={tdBase}>
                  <div className={`${cellWrapLeft} whitespace-nowrap text-[11px]`}>
                    {p.published_at ? formatDateTime(p.published_at) : '-'}
                  </div>
                </td>

                {/* ピン止め */}
                <td className={`${tdBase} text-center`}>
                  <div className="whitespace-nowrap">{p.is_pinned ? '●' : ''}</div>
                </td>

                {/* 操作 */}
                <td className={`${tdBase} text-center`}>
                  <div className="whitespace-nowrap">
                    <button
                      type="button"
                      className="px-2 py-0.5 text-[11px] rounded border bg-white hover:bg-gray-50 mr-1"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onRowClick(p);
                      }}
                    >
                      編集
                    </button>

                    <button
                      type="button"
                      className="px-2 py-0.5 text-[11px] rounded border border-red-400 text-red-600 bg-white hover:bg-red-50"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDelete(p);
                      }}
                    >
                      削除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* フッタ（新規作成ボタン） */}
      <div className="px-3 py-2 border-t bg-gray-50 flex justify-end">
        <button
          type="button"
          className="px-3 py-1 text-xs rounded-md border bg-white hover:bg-gray-100"
          onClick={onCreate}
        >
          新規作成
        </button>
      </div>
    </div>
  );
};
