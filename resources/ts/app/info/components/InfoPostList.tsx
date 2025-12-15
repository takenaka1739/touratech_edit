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
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50">
            <tr className="border-b">
              <th className="px-2 py-1 text-left w-24">ステータス</th>
              <th className="px-2 py-1 text-left">タイトル</th>
              <th className="px-2 py-1 text-left w-40">公開日時</th>
              <th className="px-2 py-1 text-center w-12">Pin</th>
              <th className="px-2 py-1 text-center w-28">操作</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 && !loading && (
              <tr>
                <td className="px-2 py-3 text-center text-gray-500" colSpan={5}>
                  データがありません
                </td>
              </tr>
            )}

            {rows.map((p) => (
              <tr
                key={p.id}
                // ★ 行クリック編集を無効化（hoverは残すが cursor-pointer は外す）
                className={`border-b hover:bg-sky-50 ${
                  selectedId === p.id ? 'bg-sky-100' : ''
                }`}
              >
                <td className="px-2 py-1">
                  <span className="inline-block rounded px-1.5 py-0.5 text-[11px] bg-gray-100">
                    {statusLabel(p.status as InfoPostStatus)}
                  </span>
                </td>

                <td className="px-2 py-1 truncate" title={p.title}>
                  {p.title}
                </td>

                <td className="px-2 py-1 text-[10px] leading-tight">
                  {p.published_at ? formatDateTime(p.published_at) : '-'}
                </td>

                <td className="px-2 py-1 text-center">{p.is_pinned ? '●' : ''}</td>

                <td className="px-2 py-1 text-center">
                  <button
                    type="button"
                    className="px-2 py-0.5 text-[11px] rounded border bg-white hover:bg-gray-50 mr-1"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onRowClick(p); // ★ 編集ボタン押下時のみ編集開始
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
