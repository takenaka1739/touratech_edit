import { useEffect, useMemo, useState } from "react";

type TabType = "shop" | "product";

type InfoItem = {
  id: number;
  published_at: string;
  title: string;
  body: string;
  status?: "draft" | "scheduled" | "published" | "archived";
  is_pinned?: boolean;
  priority?: number;
  visible_from?: string | null;
  visible_until?: string | null;
  related_product_id?: number | null;
  meta?: { external_url?: string | null };
};

type ItemSuggest = {
  id: number;
  item_number: string;
  name: string;
  label: string; // 表示用（"[ITEMNUM] 名前" など）
};

const TAB_LABEL: Record<TabType, string> = {
  shop: "ショップ情報",
  product: "商品情報",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "下書き",
  published: "公開",
  archived: "非公開",
};

const API_BASE: Record<
  TabType,
  { list: string; create: string; update: (id: number) => string; destroy: (id: number) => string }
> = {
  shop: {
    list: "/api/info/topics",
    create: "/api/info/topics",
    update: (id: number) => `/api/info/topics/${id}`,
    destroy: (id: number) => `/api/info/topics/${id}`,
  },
  product: {
    list: "/api/info/item-topics",
    create: "/api/info/item-topics",
    update: (id: number) => `/api/info/item-topics/${id}`,
    destroy: (id: number) => `/api/info/item-topics/${id}`,
  },
};

const getDefaultHeaders = () => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
  if (meta?.content) headers["X-CSRF-TOKEN"] = meta.content;
  return headers;
};

const emptyDraft: InfoItem = {
  id: 0,
  published_at: "",
  title: "",
  body: "",
  status: "draft",
  related_product_id: undefined,
  meta: { external_url: "" },
};

export default function InfoManagementPage() {
  const [tab, setTab] = useState<TabType>("shop");
  const [items, setItems] = useState<InfoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [draft, setDraft] = useState<InfoItem>(emptyDraft);
  const [error, setError] = useState<string | null>(null);

  // ▼ サジェスト（関連商品）用状態
  const [rpInput, setRpInput] = useState<string>("");                // 入力欄の文字列
  const [rpList, setRpList] = useState<ItemSuggest[]>([]);           // 候補
  const [rpLoading, setRpLoading] = useState<boolean>(false);        // 読み込み中表示
  const [rpOpen, setRpOpen] = useState<boolean>(false);              // ドロップダウン表示

  const api = useMemo(() => API_BASE[tab], [tab]);

  const normalizeArray = (json: any): InfoItem[] => {
    if (Array.isArray(json)) return json;
    if (Array.isArray(json?.data)) return json.data;
    if (Array.isArray(json?.items)) return json.items;
    if (Array.isArray(json?.data?.data)) return json.data.data;
    return [];
  };

  const fetchList = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(api.list, { credentials: "same-origin" });
      const json = await res.json();
      setItems(normalizeArray(json));
    } catch (e: any) {
      console.error("[Info] fetch error", e);
      setError("一覧の取得に失敗しました。");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setEditId(null);
    setDraft(emptyDraft);
    setRpInput("");
    setRpList([]);
    setRpOpen(false);
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  const handleSave = async () => {
    if (!draft.title || !draft.body) {
      alert("タイトル・内容は必須です");
      return;
    }
    const payload = {
      published_at: draft.published_at || new Date().toISOString().slice(0, 10),
      title: draft.title,
      body: draft.body,
      status: draft.status,
      related_product_id: draft.related_product_id ?? null,
      meta: { external_url: draft.meta?.external_url || "" },
    };

    try {
      if (editId) {
        await fetch(api.update(editId), {
          method: "PUT",
          headers: getDefaultHeaders(),
          credentials: "same-origin",
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(api.create, {
          method: "POST",
          headers: getDefaultHeaders(),
          credentials: "same-origin",
          body: JSON.stringify(payload),
        });
      }
      await fetchList();
      setEditId(null);
      setDraft(emptyDraft);
      setRpInput("");
      setRpList([]);
      setRpOpen(false);
    } catch (e: any) {
      console.error("[Info] save error", e);
      setError("保存に失敗しました。");
    }
  };

  const handleEdit = (item: InfoItem) => {
    setEditId(item.id);
    setDraft({
      ...item,
      meta: { external_url: item.meta?.external_url || "" },
      published_at: (item.published_at || "").slice(0, 10),
    });
    // 既存に関連IDがあれば簡易表示（実名取得は行わずそのまま）
    setRpInput(item.related_product_id ? `ID:${item.related_product_id}` : "");
    setRpList([]);
    setRpOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("本当に削除しますか？")) return;
    try {
      await fetch(api.destroy(id), {
        method: "DELETE",
        headers: getDefaultHeaders(),
        credentials: "same-origin",
      });
      await fetchList();
      if (editId === id) {
        setEditId(null);
        setDraft(emptyDraft);
        setRpInput("");
        setRpList([]);
        setRpOpen(false);
      }
    } catch (e: any) {
      console.error("[Info] delete error", e);
      setError("削除に失敗しました。");
    }
  };

  const onChange = <K extends keyof InfoItem>(key: K, value: any) => {
    setDraft((d) => ({ ...d, [key]: value }));
  };

  // ===== サジェスト：入力のデバウンス取得 =====
  useEffect(() => {
    const q = rpInput.trim();
    if (q === "") {
      setRpList([]);
      setRpOpen(false);
      return;
    }
    let alive = true;
    const timer = setTimeout(async () => {
      setRpLoading(true);
      try {
        const res = await fetch(`/api/info/items/lookup?q=${encodeURIComponent(q)}&limit=15`, {
          credentials: "same-origin",
        });
        const json = (await res.json()) as ItemSuggest[];
        if (!alive) return;
        setRpList(Array.isArray(json) ? json : []);
        setRpOpen(true);
      } catch (e) {
        if (!alive) return;
        setRpList([]);
        setRpOpen(false);
      } finally {
        if (alive) setRpLoading(false);
      }
    }, 300); // 300ms デバウンス

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [rpInput]);

  const pickSuggestion = (s: ItemSuggest) => {
    setDraft((d) => ({ ...d, related_product_id: s.id }));
    setRpInput(s.label);
    setRpOpen(false);
  };

  const clearRelated = () => {
    setDraft((d) => ({ ...d, related_product_id: undefined }));
    setRpInput("");
    setRpList([]);
    setRpOpen(false);
  };

  // ドロップダウンをクリックで閉じないよう、blurで少し遅らせる
  const closeDropdownLater = () => setTimeout(() => setRpOpen(false), 150);

  return (
    <div className="p-6">
      {/* タブ */}
      <div className="mb-4 flex gap-2">
        {(["shop", "product"] as TabType[]).map((t) => (
          <button
            key={t}
            className={`px-4 py-2 rounded ${tab === t ? "bg-yellow-400" : "bg-gray-200"}`}
            onClick={() => setTab(t)}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg p-4 shadow">
        <h2 className="text-lg font-bold mb-3">{TAB_LABEL[tab]}</h2>

        {error && (
          <div className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full table-fixed border border-gray-200">
            <colgroup>
              <col style={{ width: "200px" }} />
              <col style={{ width: "32%" }} />
              <col />
              <col style={{ width: "140px" }} />
            </colgroup>
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2 border-b">公開状態 / 公開日</th>
                <th className="p-2 border-b">タイトル / 外部URL</th>
                <th className="p-2 border-b">内容 / 関連商品</th>
                <th className="p-2 border-b">操作</th>
              </tr>
            </thead>
            <tbody>
              {/* 入力行 */}
              <tr className="bg-white align-top">
                <td className="p-2">
                  <select
                    className="border rounded px-2 py-1 w-full"
                    value={draft.status}
                    onChange={(e) => onChange("status", e.target.value)}
                  >
                    {Object.entries(STATUS_LABEL).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>

                  <label className="block mt-2 text-sm text-gray-600">
                    {draft.published_at ? "公開日" : "公開日付"}
                  </label>
                  <input
                    type="date"
                    className="border rounded px-2 py-1 w-full"
                    value={draft.published_at}
                    onChange={(e) => onChange("published_at", e.target.value)}
                  />
                </td>

                <td className="p-2">
                  <input
                    type="text"
                    placeholder="タイトル"
                    className="border rounded px-2 py-1 w-full mb-2"
                    value={draft.title}
                    onChange={(e) => onChange("title", e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="外部サイトURL"
                    className="border rounded px-2 py-1 w-full text-sm"
                    value={draft.meta?.external_url || ""}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        meta: { ...d.meta, external_url: e.target.value },
                      }))
                    }
                  />
                </td>

                <td className="p-2">
                  <textarea
                    placeholder="内容"
                    className="border rounded px-2 py-1 w-full h-20"
                    value={draft.body}
                    onChange={(e) => onChange("body", e.target.value)}
                  />

                  {/* ▼ 関連商品（サジェスト） */}
                  <div className="mt-2">
                    <label className="text-sm text-gray-600 mr-2">関連商品：</label>
                    <div className="relative inline-block min-w-[320px] align-top">
                      <input
                        type="text"
                        className="border rounded px-2 py-1 w-full pr-20"
                        placeholder="商品番号・名称・ID で検索"
                        value={rpInput}
                        onChange={(e) => setRpInput(e.target.value)}
                        onFocus={() => rpList.length > 0 && setRpOpen(true)}
                        onBlur={closeDropdownLater}
                      />
                      <div className="absolute right-1 top-1 flex gap-1">
                        {draft.related_product_id ? (
                          <a
                            className="text-blue-600 underline text-xs px-1 py-0.5"
                            href={`/products/${draft.related_product_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            商品ページ
                          </a>
                        ) : null}
                        <button
                          type="button"
                          className="text-gray-500 border rounded px-1 text-xs"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={clearRelated}
                          title="クリア"
                        >
                          クリア
                        </button>
                      </div>

                      {/* ドロップダウン */}
                      {rpOpen && (
                        <div className="absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded border bg-white shadow">
                          {rpLoading && (
                            <div className="px-3 py-2 text-sm text-gray-500">検索中…</div>
                          )}
                          {!rpLoading && rpList.length === 0 && (
                            <div className="px-3 py-2 text-sm text-gray-500">候補がありません</div>
                          )}
                          {!rpLoading &&
                            rpList.map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                className="block w-full text-left px-3 py-2 hover:bg-yellow-50"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => pickSuggestion(s)}
                                title={`ID:${s.id}`}
                              >
                                <div className="text-sm">{s.label}</div>
                                <div className="text-xs text-gray-500">ID:{s.id}</div>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                    {draft.related_product_id && (
                      <div className="text-xs text-gray-600 mt-1">
                        選択中: ID {draft.related_product_id}
                      </div>
                    )}
                  </div>
                  {/* ▲ 関連商品（サジェスト） */}
                </td>

                <td className="p-2 align-top">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={handleSave}
                      className="bg-yellow-400 hover:bg-yellow-500 px-3 py-1 rounded"
                    >
                      {editId ? "更新" : "新規追加"}
                    </button>
                    {editId && (
                      <button
                        className="text-gray-500 underline text-sm"
                        onClick={() => {
                          setEditId(null);
                          setDraft(emptyDraft);
                          setRpInput("");
                          setRpList([]);
                          setRpOpen(false);
                        }}
                      >
                        ｷｬﾝｾﾙ
                      </button>
                    )}
                  </div>
                </td>
              </tr>

              {/* 既存データ */}
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-4 text-gray-500">
                    読み込み中…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-gray-500">
                    保存済みデータはありません
                  </td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr key={it.id} className={editId === it.id ? "bg-yellow-50" : ""}>
                    <td className="p-2 border-t align-top">
                      <span className="block">{STATUS_LABEL[it.status || "draft"]}</span>
                      <span className="text-xs text-gray-500">
                        {(it.published_at || "").slice(0, 10)}
                      </span>
                    </td>
                    <td className="p-2 border-t align-top">
                      <div className="font-semibold">{it.title}</div>
                      {it.meta?.external_url && (
                        <a
                          href={it.meta.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline text-sm break-all"
                        >
                          {it.meta.external_url}
                        </a>
                      )}
                    </td>
                    <td className="p-2 border-t align-top">
                      <div className="whitespace-pre-wrap">{it.body}</div>
                      {it.related_product_id && (
                        <a
                          href={`/products/${it.related_product_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline text-xs block mt-1"
                        >
                          関連商品を見る
                        </a>
                      )}
                    </td>
                    <td className="p-2 border-t align-top">
                      <button
                        className="text-blue-600 underline mr-3"
                        onClick={() => handleEdit(it)}
                      >
                        編集
                      </button>
                      <button
                        className="text-red-600 underline"
                        onClick={() => handleDelete(it.id)}
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
