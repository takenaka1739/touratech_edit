// resources/ts/app/info/pages/InfoManagementPage.tsx

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { PageWrapper } from '@/components';
import {
  InfoItemSelectModal,
  type InfoItem,
} from '@/app/info/components/InfoItemSelectModal';
import { InfoPostList } from '@/app/info/components/InfoPostList';
import { InfoPostForm } from '@/app/info/components/InfoPostForm';

type InfoPostType = 'shop' | 'product'; // UI上は「Topics」「Items」として表示
type InfoPostStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export interface InfoPost {
  id: number;
  type: InfoPostType;
  status: InfoPostStatus;
  title: string;
  slug?: string | null;
  excerpt?: string | null;
  body_md?: string | null;
  body_html?: string | null;
  cover_image_id?: number | null;
  published_at?: string | null;
  visible_from?: string | null;
  visible_until?: string | null;
  is_pinned: boolean | number;
  pin_until?: string | null;
  priority: number;
  related_product_id?: number | null;
  author_id?: number | null;
  updated_by?: number | null;
  meta?: any;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface EditFormState {
  id?: number;
  type: InfoPostType;
  status: InfoPostStatus;
  title: string;
  body_md: string;

  // Items のときだけ使う
  related_product_id: string;
  related_product_name: string;

  // 公開系（シンプル）
  published_at: string; // 公開日時

  // ピン系
  is_pinned: boolean;
  priority: string;

  // 詳細設定（デフォルト非表示）
  visible_from: string;
  visible_until: string;
  pin_until: string;
  external_url: string; // リンクURL（外部URL or 相対パス）
}

const defaultFormState: EditFormState = {
  id: undefined,
  type: 'shop',
  status: 'draft',
  title: '',
  body_md: '',
  related_product_id: '',
  related_product_name: '',
  published_at: '',
  is_pinned: false,
  priority: '0',
  visible_from: '',
  visible_until: '',
  pin_until: '',
  external_url: '',
};

const InfoManagementPage: React.FC = () => {
  const title = '情報管理';
  const slug = 'info';

  const [posts, setPosts] = useState<InfoPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 画面上部のタブ（Topics / Items）
  const [activeType, setActiveType] = useState<InfoPostType>('shop');

  const [form, setForm] = useState<EditFormState>({
    ...defaultFormState,
    type: activeType,
  });
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // 商品選択モーダル
  const [itemModalOpen, setItemModalOpen] = useState(false);

  // === 一覧取得 ===
  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/info/posts', {
        params: {
          type: activeType,
        },
      });

      let data = res.data;
      let rows: InfoPost[] = [];

      if (Array.isArray(data)) {
        rows = data;
      } else if (Array.isArray(data?.data)) {
        rows = data.data;
      } else if (Array.isArray(data?.rows)) {
        rows = data.rows;
      } else {
        rows = [];
      }

      setPosts(rows);
    } catch (e: any) {
      console.error(e);
      setError('一覧の取得に失敗しました。API のパスやレスポンス形式を確認してください。');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // 初回 + タブ切替時に再取得
  useEffect(() => {
    fetchPosts();
    // タブ切替時はフォームもリセット
    setForm({
      ...defaultFormState,
      type: activeType,
    });
    setSelectedId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeType]);

  // === フォーム関連 ===
  const startCreate = () => {
    setForm({
      ...defaultFormState,
      type: activeType,
    });
    setSelectedId(null);
  };

  /**
   * 編集開始
   * 「編集ボタンを押した場合のみ」ここが呼ばれる前提（InfoPostList側で制御）
   *
   * 注意:
   * 以前は `setActiveType(p.type)` でタブを強制的に切替えていたが、
   * クリックだけで編集開始してしまう挙動の原因になりやすいため削除。
   * タブ切替はユーザー操作（上部タブ）に限定する。
   */
  const startEdit = (p: InfoPost) => {
    setForm({
      id: p.id,
      type: p.type,
      status: p.status,
      title: p.title ?? '',
      body_md: p.body_md ?? '',
      related_product_id: p.related_product_id != null ? String(p.related_product_id) : '',
      related_product_name: '', // 必要なら別APIで名前を引く
      published_at: toInputDateTime(p.published_at),
      is_pinned: !!p.is_pinned,
      priority: String(p.priority ?? 0),
      visible_from: toInputDateTime(p.visible_from),
      visible_until: toInputDateTime(p.visible_until),
      pin_until: toInputDateTime(p.pin_until),
      external_url: p.meta?.external_url ?? '',
    });
    setSelectedId(p.id);
  };

  const resetForm = () => {
    setForm({
      ...defaultFormState,
      type: activeType,
    });
    setSelectedId(null);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const { name } = target;

    let value: string | boolean = (target as HTMLInputElement).value;

    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      value = target.checked;
    } else {
      value = target.value;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value as any,
    }));
  };

  // === 保存 ===
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = formToPayload(form);

      if (form.id) {
        await axios.put(`/api/info/posts/${form.id}`, payload);
      } else {
        await axios.post('/api/info/posts', payload);
      }

      await fetchPosts();
      resetForm();
    } catch (e: any) {
      console.error(e);
      setError('保存に失敗しました。入力値と API 側のバリデーションを確認してください。');
    } finally {
      setSaving(false);
    }
  };

  // === 削除 ===
  const handleDelete = async (post: InfoPost) => {
    if (!window.confirm(`「${post.title}」を削除してよろしいですか？`)) {
      return;
    }
    try {
      await axios.delete(`/api/info/posts/${post.id}`);
      if (selectedId === post.id) {
        resetForm();
      }
      await fetchPosts();
    } catch (e: any) {
      console.error(e);
      setError('削除に失敗しました。');
    }
  };

  // === 表示用 ===
  const filteredPosts = useMemo<InfoPost[]>(() => {
    if (!Array.isArray(posts)) return [];
    return posts;
  }, [posts]);

  return (
    <PageWrapper prefix={slug} title={title} breadcrumb={[{ name: title }]}>
      <div className="space-y-4">
        {/* タブ */}
        <div className="border-b flex gap-2">
          <button
            type="button"
            className={`px-4 py-2 text-sm border-b-2 ${
              activeType === 'shop'
                ? 'border-sky-600 text-sky-700 font-semibold'
                : 'border-transparent text-gray-500'
            }`}
            onClick={() => setActiveType('shop')}
          >
            Topics（ショップ情報）
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm border-b-2 ${
              activeType === 'product'
                ? 'border-sky-600 text-sky-700 font-semibold'
                : 'border-transparent text-gray-500'
            }`}
            onClick={() => setActiveType('product')}
          >
            Items（商品情報）
          </button>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="border border-red-300 bg-red-50 text-red-700 px-3 py-2 rounded text-sm">
            {error}
          </div>
        )}

        {/* 一覧 + フォーム */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
          <InfoPostList
            activeType={activeType}
            posts={filteredPosts}
            selectedId={selectedId}
            loading={loading}
            onRowClick={startEdit}
            onDelete={handleDelete}
            onCreate={startCreate}
          />

          <InfoPostForm
            activeType={activeType}
            form={form}
            saving={saving}
            onChange={handleChange}
            onSave={handleSave}
            onReset={resetForm}
            onOpenItemModal={() => setItemModalOpen(true)}
          />
        </div>
      </div>

      {/* 商品選択モーダル（Items のときだけ開く） */}
      <InfoItemSelectModal
        isOpen={itemModalOpen && activeType === 'product'}
        initialSelectedId={form.related_product_id ? Number(form.related_product_id) : null}
        onClose={() => setItemModalOpen(false)}
        onConfirm={(item: InfoItem | null) => {
          if (item) {
            setForm((prev) => ({
              ...prev,
              related_product_id: String(item.id),
              related_product_name: item.name,
            }));
          }
          setItemModalOpen(false);
        }}
      />
    </PageWrapper>
  );
};

// ==== ユーティリティ ====

// DB からの ISO 文字列などを datetime-local 入力用に変換
function toInputDateTime(value?: string | null): string {
  if (!value) return '';
  try {
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
      return value.slice(0, 16);
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  } catch {
    return '';
  }
}

// フォーム → API ペイロード変換
export function formToPayload(form: EditFormState) {
  const numOrNull = (v: string): number | null => (v.trim() === '' ? null : Number(v));

  const dtOrNull = (v: string): string | null => (v.trim() === '' ? null : v);

  const meta: any = {};
  if (form.external_url.trim() !== '') {
    meta.external_url = form.external_url.trim();
  }

  return {
    type: form.type,
    status: form.status,
    title: form.title.trim(),
    // スラッグは一旦使わない（常に null）
    slug: null,
    body_md: form.body_md,
    // カバー画像も一旦使わない（常に null）
    cover_image_id: null,
    published_at: dtOrNull(form.published_at),
    visible_from: dtOrNull(form.visible_from),
    visible_until: dtOrNull(form.visible_until),
    is_pinned: form.is_pinned ? 1 : 0,
    pin_until: dtOrNull(form.pin_until),
    priority: Number(form.priority || '0'),
    related_product_id: numOrNull(form.related_product_id),
    meta: Object.keys(meta).length ? meta : null,
  };
}

export default InfoManagementPage;
