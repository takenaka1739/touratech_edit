// 更新: resources/ts/app/Inquiry/pages/InquiryReplyDetailPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { MailPageWrapper } from '../components/detail/MailPageWrapper';
import { useInquiryReplyDetailPage } from '../uses/useInquiryReplyDetailPage';

type HistoryRow = {
  id: number;
  subject?: string | null;
  to_email?: string | null;
  send_status?: number | null;
  error_message?: string | null;
  reply_at?: string | null;
  created_at?: string | null;
  body_text?: string | null;
  reply_content?: string | null;
};

type TemplateRow = {
  id: number;
  title?: string | null; // m_mail_templates は title
  name?: string | null; // 念のため互換
  subject_template?: string | null;
  header_template?: string | null;
  footer_template?: string | null;

  // 旧/互換フィールド（環境差吸収）
  subject?: string | null;
  body_text?: string | null;
  body?: string | null;
};

const pickTplTitle = (t: TemplateRow) => (t.title ?? t.name ?? `template#${t.id}`).toString();
const pickTplSubject = (t: TemplateRow) => (t.subject_template ?? t.subject ?? '').toString();
const pickTplBody = (t: TemplateRow) => (t.body_text ?? t.body ?? '').toString();

/** YYYY/MM/DD だけに整形（ISO/DB timestamp でもOK） */
const toYmd = (v: any): string => {
  const s = (v ?? '').toString().trim();
  if (!s) return '';
  const m = s.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (!m) return s;
  return `${m[1]}/${m[2]}/${m[3]}`;
};

const inquiryTypeLabel = (v: any): string => {
  if (v === null || v === undefined) return '';
  return String(v);
};

const publicLabel = (v: any): string => {
  const n = Number(v);
  if (n === 1) return '公開';
  if (n === 0) return '非公開';
  return String(v ?? '');
};

const applyPlaceholders = (text: string, inquiry: any) => {
  const customerName = (inquiry?.customer_name ?? '').toString();
  const email = (inquiry?.email ?? '').toString();
  const inqType = inquiryTypeLabel(inquiry?.content ?? '');
  const details = (inquiry?.details ?? '').toString();

  return (text || '')
    .replaceAll('{CUSTOMER_NAME}', customerName)
    .replaceAll('{EMAIL}', email)
    .replaceAll('{INQUIRY_SUBJECT}', inqType)
    .replaceAll('{INQUIRY_BODY}', details);
};

// ===== styles =====
const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: 16,
};

const sectionTitleStyle: React.CSSProperties = {
  fontWeight: 700,
  marginBottom: 8,
};

const labelStyle: React.CSSProperties = {
  color: '#6b7280',
  fontSize: 12,
  whiteSpace: 'nowrap',
};

const valueStyle: React.CSSProperties = {
  fontSize: 14,
  overflowWrap: 'anywhere',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  fontSize: 14,
  background: '#ffffff',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  fontSize: 14,
  background: '#ffffff',
  minHeight: 220,
  resize: 'vertical',
};

const badgeBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '3px 10px',
  borderRadius: 999,
  fontSize: 12,
  lineHeight: 1.2,
  fontWeight: 700,
  whiteSpace: 'nowrap',
};

const statusBadge = (sendStatus: any): React.CSSProperties => {
  const n = Number(sendStatus);
  // 1:送信済 / 2:送信失敗
  if (n === 1) {
    return { ...badgeBase, background: '#dcfce7', color: '#166534', border: '1px solid #86efac' };
  }
  if (n === 2) {
    return { ...badgeBase, background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' };
  }
  return { ...badgeBase, background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' };
};

const statusLabel = (sendStatus: any): string => {
  const n = Number(sendStatus);
  if (n === 1) return '送信済';
  if (n === 2) return '送信失敗';
  return String(sendStatus ?? '');
};

export const InquiryReplyDetailPage: React.VFC = () => {
  const params = useParams<{ id?: string }>();
  const id = Number(params.id);

  const title = 'お問い合わせ詳細';

  const { isLoading, inquiry, rows, reload } = useInquiryReplyDetailPage(id);

  // ===== 履歴モーダル =====
  const [openId, setOpenId] = useState<number | null>(null);
  const openRow = useMemo(() => {
    if (openId === null) return null;
    return (rows ?? []).find((r: any) => Number(r.id) === openId) ?? null;
  }, [openId, rows]);

  const bodyTextModal = useMemo(() => {
    if (!openRow) return '';
    const r = openRow as HistoryRow;
    return (r.body_text ?? r.reply_content ?? '').toString();
  }, [openRow]);

  // ===== テンプレ & 返信フォーム =====
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [tplLoading, setTplLoading] = useState(false);

  const [templateId, setTemplateId] = useState<number | ''>('');
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [sendLoading, setSendLoading] = useState(false);

  // 初期値（問い合わせが取れたら）
  useEffect(() => {
    setToEmail((inquiry?.email ?? '').toString());

    const typeText = inquiryTypeLabel(inquiry?.content ?? '');
    const base = typeText ? `Re: お問い合わせ（${typeText}）` : 'Re: お問い合わせ';
    const withId = inquiry?.id ? `${base} [${inquiry.id}]` : base;
    setSubject(withId);
  }, [inquiry?.email, inquiry?.content, inquiry?.id]);

  // テンプレ取得（API 形式: { success, data: { rows } }）
  useEffect(() => {
    const run = async () => {
      setTplLoading(true);
      try {
        const res = await axios.get('/api/shop-mail/templates');
        const list: TemplateRow[] =
          res.data?.data?.rows ??
          res.data?.data?.templates ??
          res.data?.rows ??
          res.data?.templates ??
          res.data ??
          [];
        setTemplates(Array.isArray(list) ? list : []);
      } finally {
        setTplLoading(false);
      }
    };
    run();
  }, []);

  const selectedTemplate = useMemo(() => {
    if (!templateId) return null;
    return templates.find((t) => Number(t.id) === Number(templateId)) ?? null;
  }, [templateId, templates]);

  // テンプレ反映（subject/body）
  useEffect(() => {
    if (!selectedTemplate) return;

    const tplSubject = applyPlaceholders(pickTplSubject(selectedTemplate), inquiry);
    const tplBodyBase = pickTplBody(selectedTemplate);

    // header/footer があるテンプレは合成
    const header = (selectedTemplate.header_template ?? '').toString().trim();
    const footer = (selectedTemplate.footer_template ?? '').toString().trim();

    const composed = [header, tplBodyBase, footer]
      .filter((v) => (v ?? '').toString().trim() !== '')
      .join('\n\n');

    const tplBody = applyPlaceholders(composed, inquiry);

    if (tplSubject.trim()) setSubject(tplSubject);
    setBodyText(tplBody);
  }, [selectedTemplate, inquiry]);

  const onSend = async () => {
    if (!id) return;

    const to = toEmail.trim();
    const subj = subject.trim();
    const body = bodyText;

    if (!to) return alert('宛先メールアドレスが空です');
    if (!subj) return alert('件名が空です');
    if (!body) return alert('本文が空です');

    if (!confirm('この内容で送信しますか？')) return;

    setSendLoading(true);
    try {
      const payload = {
        mail_template_id: templateId === '' ? null : templateId,
        to_email: to,
        subject: subj,
        body_text: body,
      };

      const res = await axios.post(`/api/shop-mail/inquiries/${id}/send`, payload);

      if (res.data?.ok) {
        alert('送信しました');
      } else {
        alert(`送信失敗: ${res.data?.error ?? res.data?.message ?? ''}`);
      }

      await reload();
    } catch (e: any) {
      alert(`送信失敗: ${e?.response?.data?.message ?? e?.message ?? e}`);
      await reload();
    } finally {
      setSendLoading(false);
    }
  };

  // ===== 履歴は「カード化」するので TableWrapper は使わない =====
  const historyCards = useMemo(() => {
    const list = (rows ?? []) as any[];

    if (!list.length) {
      return (
        <div
          style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            padding: 12,
            color: '#6b7280',
            fontSize: 13,
          }}
        >
          （送信履歴がありません）
        </div>
      );
    }

    // 新しい順で見やすく（必要なら asc に戻せます）
    const sorted = [...list].sort((a, b) => Number(b.id) - Number(a.id));

    return (
      <div className="grid grid-cols-1 gap-2">
        {sorted.map((r) => {
          const ymd = toYmd(r.reply_at ?? r.created_at ?? '');
          const st = r.send_status;

          return (
            <div
              key={r.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                padding: 12,
                background: '#ffffff',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div style={{ minWidth: 0 }}>
                  <button
                    type="button"
                    className="link"
                    onClick={() => setOpenId(Number(r.id))}
                    style={{ fontWeight: 700 }}
                    title={r.subject ?? ''}
                  >
                    {r.subject ?? '(件名なし)'}
                  </button>

                  <div style={{ marginTop: 6, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ ...labelStyle }}>送信日:</span>
                    <span style={{ fontSize: 13 }}>{ymd || '-'}</span>

                    <span style={{ ...labelStyle }}>宛先:</span>
                    <span style={{ fontSize: 13, overflowWrap: 'anywhere' }}>{r.to_email ?? '-'}</span>
                  </div>
                </div>

                <div style={{ flexShrink: 0 }}>
                  <span style={statusBadge(st)}>{statusLabel(st)}</span>
                </div>
              </div>

              {Number(st) === 2 && r.error_message ? (
                <div style={{ marginTop: 10 }}>
                  <div style={{ ...labelStyle, marginBottom: 4 }}>送信失敗理由</div>
                  <div
                    style={{
                      whiteSpace: 'pre-wrap',
                      background: '#fff7ed',
                      border: '1px solid #fed7aa',
                      borderRadius: 8,
                      padding: 10,
                      fontSize: 13,
                      color: '#9a3412',
                    }}
                  >
                    {String(r.error_message)}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  }, [rows]);

  return (
    <MailPageWrapper
      prefix="shop-mail"
      title={title}
      breadcrumb={[
        { name: 'お問い合わせ一覧', url: '/inquiry' },
        { name: title },
      ]}
    >
      {/* actions */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex gap-2">
          <Link className="btn" to="/inquiry">
            一覧へ戻る
          </Link>
          <button className="btn" type="button" onClick={reload} disabled={isLoading}>
            再読み込み
          </button>
        </div>
      </div>

      {/* ===== 上段: 左(問い合わせ) / 右(返信) ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        {/* Left: 問い合わせ情報 + 本文 */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>問い合わせ情報</div>

          {/* label:value を揃える（崩れない） */}
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <dt style={labelStyle}>お問い合わせID</dt>
              <dd style={valueStyle}>{inquiry?.id ?? ''}</dd>
            </div>
            <div>
              <dt style={labelStyle}>お問い合わせ日</dt>
              <dd style={valueStyle}>{toYmd(inquiry?.created_at ?? '')}</dd>
            </div>
            <div>
              <dt style={labelStyle}>お問い合わせ種別</dt>
              <dd style={valueStyle}>{inquiryTypeLabel(inquiry?.content ?? '')}</dd>
            </div>
            <div>
              <dt style={labelStyle}>公開</dt>
              <dd style={valueStyle}>
                <span style={{ ...badgeBase, background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' }}>
                  {publicLabel(inquiry?.is_public ?? '')}
                </span>
              </dd>
            </div>
            <div>
              <dt style={labelStyle}>氏名</dt>
              <dd style={valueStyle}>{inquiry?.customer_name ?? ''}</dd>
            </div>
            <div>
              <dt style={labelStyle}>email</dt>
              <dd style={valueStyle}>{inquiry?.email ?? ''}</dd>
            </div>
          </dl>

          <div style={{ marginTop: 14 }}>
            <div style={sectionTitleStyle}>問い合わせ内容</div>
            <div
              style={{
                whiteSpace: 'pre-wrap',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                padding: 12,
                minHeight: 140,
                fontSize: 14,
              }}
            >
              {inquiry?.details ?? '（内容がありません）'}
            </div>
          </div>
        </div>

        {/* Right: テンプレ返信 */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>テンプレで返信</div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <div className="form-label-text">テンプレ</div>
              <select
                value={templateId}
                onChange={(e) => {
                  const v = e.target.value;
                  setTemplateId(v === '' ? '' : Number(v));
                }}
                disabled={tplLoading}
                style={inputStyle}
              >
                <option value="">（選択なし）</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {pickTplTitle(t)}
                  </option>
                ))}
              </select>

              <div className="text-xs text-gray-500 mt-1">
                置換: {'{CUSTOMER_NAME}'} / {'{EMAIL}'} / {'{INQUIRY_SUBJECT}'} / {'{INQUIRY_BODY}'}
              </div>
            </div>

            <div>
              <div className="form-label-text">宛先</div>
              <input value={toEmail} onChange={(e) => setToEmail(e.target.value)} style={inputStyle} />
            </div>

            <div>
              <div className="form-label-text">件名</div>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} style={inputStyle} />
            </div>

            <div>
              <div className="form-label-text">本文</div>
              <textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} style={textareaStyle} />
            </div>

            <div className="flex gap-2">
              <button className="btn btn-primary" type="button" onClick={onSend} disabled={sendLoading}>
                {sendLoading ? '送信中...' : '送信'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== 下段: 履歴（カード化＋バッジ） ===== */}
      <div style={{ ...cardStyle, marginBottom: 8 }}>
        <div className="flex items-center justify-between">
          <div style={sectionTitleStyle}>送信履歴</div>
          <div style={{ color: '#6b7280', fontSize: 12 }}>
            {isLoading ? '読み込み中...' : `${(rows ?? []).length} 件`}
          </div>
        </div>

        {/* 既存 TableWrapper は残してもいいが、今回はカードで表示 */}
        {historyCards}
      </div>

      {/* 履歴本文モーダル */}
      {openRow && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 50,
          }}
          onClick={() => setOpenId(null)}
        >
          <div
            style={{ ...cardStyle, width: 'min(900px, 100%)', maxHeight: '80vh', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <div style={{ fontWeight: 700 }}>{(openRow as any).subject ?? '(件名なし)'}</div>
              <button className="btn" type="button" onClick={() => setOpenId(null)}>
                閉じる
              </button>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span style={statusBadge((openRow as any).send_status)}>{statusLabel((openRow as any).send_status)}</span>
              <span style={{ color: '#6b7280', fontSize: 12 }}>
                {toYmd((openRow as any).reply_at ?? (openRow as any).created_at ?? '')}
              </span>
              {(openRow as any).to_email ? (
                <span style={{ color: '#6b7280', fontSize: 12, overflowWrap: 'anywhere' }}>
                  宛先: {(openRow as any).to_email}
                </span>
              ) : null}
            </div>

            {(openRow as any).error_message ? (
              <div className="mb-2" style={{ whiteSpace: 'pre-wrap' }}>
                <div className="form-label-text">送信失敗理由</div>
                <div
                  style={{
                    whiteSpace: 'pre-wrap',
                    background: '#fff7ed',
                    border: '1px solid #fed7aa',
                    borderRadius: 8,
                    padding: 10,
                    fontSize: 13,
                    color: '#9a3412',
                  }}
                >
                  {(openRow as any).error_message}
                </div>
              </div>
            ) : null}

            <div
              style={{
                whiteSpace: 'pre-wrap',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                padding: 12,
              }}
            >
              {bodyTextModal || '（本文がありません）'}
            </div>
          </div>
        </div>
      )}
    </MailPageWrapper>
  );
};