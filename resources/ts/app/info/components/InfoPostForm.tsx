// resources/ts/app/info/components/InfoPostForm.tsx

import React, { useState } from 'react';
import type { EditFormState } from '@/app/info/pages/InfoManagementPage';

type InfoPostType = 'shop' | 'product';

type Props = {
  activeType: InfoPostType;
  form: EditFormState;
  saving: boolean;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void;
  onSave: () => void;
  onReset: () => void;
  onOpenItemModal: () => void;
};

export const InfoPostForm: React.FC<Props> = ({
  activeType,
  form,
  saving,
  onChange,
  onSave,
  onReset,
  onOpenItemModal,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const typeLabel = (type: InfoPostType) =>
    type === 'shop' ? 'Topics' : 'Items';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // タイトル未入力なら保存しない
    if (!form.title.trim()) {
      alert('タイトルを入力してください。');
      return;
    }

    onSave();
  };

  // 本文の現在文字数
  const bodyLength = form.body_md ? form.body_md.length : 0;
  const BODY_MAX = 2000; // お好みで調整

  return (
    <div className="border rounded-md bg-white p-4 space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ヘッダ */}
        <div className="flex justify-between items-center">
          <div className="font-semibold text-sm">
            {form.id
              ? `編集：${typeLabel(form.type)}（ID: ${form.id}）`
              : `新規作成：${typeLabel(activeType)}`}
          </div>
        </div>

        {/* ステータス */}
        <div>
          <label className="text-xs font-semibold mb-1 block">
            公開状態
          </label>
          <select
            name="status"
            className="border rounded-md px-2 py-1 text-sm w-full"
            value={form.status}
            onChange={onChange}
          >
            <option value="draft">下書き</option>
            <option value="published">公開中（公開日時で即時/予約）</option>
            <option value="archived">アーカイブ（公開対象外）</option>
          </select>
        </div>

        {/* タイトル */}
        <div>
          <label className="text-xs font-semibold mb-1 block">
            タイトル <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            className="border rounded-md px-2 py-1 text-sm w-full"
            value={form.title}
            onChange={onChange}
            maxLength={200}
          />
        </div>

        {/* 本文（要約は廃止し、本文だけを使う） */}
        <div>
          <label className="text-xs font-semibold mb-1 block">
            本文（Markdown）
            <span className="ml-2 text-[10px] text-gray-500">
              最大 {BODY_MAX} 文字目安（現在 {bodyLength} 文字）
            </span>
          </label>
          <textarea
            name="body_md"
            className="border rounded-md px-2 py-1 text-sm w-full font-mono"
            rows={6}
            value={form.body_md}
            onChange={onChange}
            maxLength={BODY_MAX}
          />
        </div>

        {/* Items のときだけ：関連商品 */}
        {activeType === 'product' && (
          <div>
            <label className="text-xs font-semibold mb-1 block">
              関連商品（クリックすると商品ページへ）
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 text-xs border rounded px-2 py-1 bg-gray-50 min-h-[32px]">
                {form.related_product_id
                  ? `ID: ${form.related_product_id}${
                      form.related_product_name
                        ? ` / ${form.related_product_name}`
                        : ''
                    }`
                  : '未選択'}
              </div>
              <button
                type="button"
                className="btn-sub"
                onClick={onOpenItemModal}
              >
                商品を選択
              </button>
              {form.related_product_id && (
                <button
                  type="button"
                  className="btn-delete"
                  onClick={onReset}
                >
                  クリア
                </button>
              )}
            </div>
          </div>
        )}

        {/* 公開日時 + Pin + 優先度 */}
        <div className="grid grid-cols-2 gap-3 items-end">
          <div>
            <label className="text-xs font-semibold mb-1 block">
              公開日時（指定しない場合は即時）
            </label>
            <input
              type="datetime-local"
              name="published_at"
              className="border rounded-md px-2 py-1 text-sm w-full"
              value={form.published_at}
              onChange={onChange}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                id="is_pinned"
                name="is_pinned"
                checked={form.is_pinned}
                onChange={onChange}
              />
              <label htmlFor="is_pinned" className="text-xs font-semibold">
                ピン留め（一覧上部に固定）
              </label>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block">
                優先度（数値が大きいほど上に表示）
              </label>
              <input
                type="number"
                name="priority"
                className="border rounded-md px-2 py-1 text-sm w-full"
                value={form.priority}
                onChange={onChange}
              />
            </div>
          </div>
        </div>

        {/* 詳細設定の折りたたみ */}
        <div className="border-t pt-3">
          <button
            type="button"
            className="text-xs text-sky-700 hover:underline flex items-center gap-1"
            onClick={() => setShowAdvanced((prev) => !prev)}
          >
            <span>{showAdvanced ? '▲ 詳細設定を閉じる' : '▼ 詳細設定を開く'}</span>
          </button>

          {showAdvanced && (
            <div className="mt-3 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold mb-1 block">
                    表示開始日時（visible_from）
                  </label>
                  <input
                    type="datetime-local"
                    name="visible_from"
                    className="border rounded-md px-2 py-1 text-sm w-full"
                    value={form.visible_from}
                    onChange={onChange}
                  />
                </div>
                <div>
                  <label className="font-semibold mb-1 block">
                    表示終了日時（visible_until）
                  </label>
                  <input
                    type="datetime-local"
                    name="visible_until"
                    className="border rounded-md px-2 py-1 text-sm w-full"
                    value={form.visible_until}
                    onChange={onChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold mb-1 block">
                    ピン留め期限（pin_until）
                  </label>
                  <input
                    type="datetime-local"
                    name="pin_until"
                    className="border rounded-md px-2 py-1 text-sm w-full"
                    value={form.pin_until}
                    onChange={onChange}
                  />
                </div>
                <div>
                  <label className="font-semibold mb-1 block">
                    リンクURL（任意）
                  </label>
                  <input
                    type="text"
                    name="external_url"
                    className="border rounded-md px-2 py-1 text-sm w-full"
                    value={form.external_url}
                    onChange={onChange}
                    placeholder="外部URL または /help/campaign などの相対パス"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ボタン（クリア + 保存） */}
        <div className="flex justify-end gap-2 pt-2 border-t">
          <button
            type="button"
            className="btn-sub"
            onClick={onReset}
          >
            クリア
          </button>
          <button
            type="submit"
            className="btn"
            disabled={saving}
          >
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
};
