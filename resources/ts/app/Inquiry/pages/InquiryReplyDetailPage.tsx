// 更新: resources/ts/app/Inquiry/pages/InquiryReplyDetailPage.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
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

/** YYYY/MM/DD HH:mm だけに整形（ISO/DB timestamp でもOK） */
const toYmdHm = (v: any): string => {
  const s = (v ?? '').toString().trim();
  if (!s) return '';
  const m = s.match(/^(\d{4})[-/](\d{2})[-/](\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (!m) return s;
  const ymd = `${m[1]}/${m[2]}/${m[3]}`;
  if (m[4] && m[5]) return `${ymd} ${m[4]}:${m[5]}`;
  return ymd;
};

const inquiryTypeLabel = (v: any): string => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s === '1') return '商品に関するお問い合わせ';
  if (s === '2') return '納期に関するお問い合わせ';
  return s;
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

const buildInquiryReference = (inquiry: any): string => {
  const inqType = inquiryTypeLabel(inquiry?.content ?? '').trim();
  const details = (inquiry?.details ?? '').toString().trim();
  const inquiredAt = toYmdHm(inquiry?.created_at ?? '').trim();

  if (!inquiredAt && !inqType && !details) return '';

  return [
    '【お問い合わせ内容】',
    inquiredAt ? `お問い合わせ日時：${inquiredAt}` : '',
    inqType ? `お問い合わせ種別：${inqType}` : '',
    details ? ['お問い合わせ本文：', details].join('\n') : '',
  ]
    .filter((v) => v !== '')
    .join('\n');
};

const DEFAULT_INQUIRY_REPLY_FOOTER = `△▲△▲△▲ < TOURATECH JAPAN > △▲△▲△▲△▲△▲△▲△▲△▲△▲△▲△▲△▲△▲△▲△▲
『ツアラテックジャパン』  〒252-0157 　神奈川県相模原市緑区中野988
TEL: 042-850-4790 　/ 　FAX: 042-850-4792 　/ 　Mail： info@touratechjapan.com
営業時間：10:00-19:00　　店舗営業日：土/日/祝　　定休日：毎週火曜水曜
公式HP ： http://www.touratechjapan.com
公式ネットショップ：https://www.touratechjapan.com/e-commex/cgi-bin/ex_index.cgi
△▲△▲△▲< made for adventure > △▲△▲△▲△▲△▲△▲△▲△▲△▲△▲△▲△▲△▲△▲△▲`;

const buildDefaultReplyBody = (_inquiry: any): string => '';

const buildDefaultReplyFooter = (inquiry: any): string => {
  return [buildInquiryReference(inquiry), DEFAULT_INQUIRY_REPLY_FOOTER]
    .filter((v) => (v ?? '').toString().trim() !== '')
    .join('\n\n');
};

const composeReplyBody = (header: string, body: string, footer: string): string => {
  return [header, body, footer]
    .filter((v) => (v ?? '').toString().trim() !== '')
    .join('\n\n');
};

const friendlyMailError = (value: any): string => {
  const raw = (value ?? '').toString().trim();
  const lower = raw.toLowerCase();

  if (!raw) return 'メールを送信できませんでした。時間をおいて再度お試しください。';

  if (raw.includes('送信元メールアドレス') || raw.includes('宛先メールアドレス')) {
    return raw;
  }

  if (
    lower.includes('connection could not be established') ||
    lower.includes('connection refused') ||
    lower.includes('timed out') ||
    lower.includes('stream_socket_client') ||
    lower.includes('network is unreachable') ||
    lower.includes('could not connect')
  ) {
    return 'メールサーバーに接続できませんでした。メール設定またはネットワーク状況を確認してください。';
  }

  if (
    lower.includes('authentication') ||
    lower.includes('authenticate') ||
    lower.includes('username') ||
    lower.includes('password') ||
    lower.includes('535')
  ) {
    return 'メールサーバーへのログインに失敗しました。メールアカウントまたはパスワードを確認してください。';
  }

  if (
    lower.includes('invalid address') ||
    lower.includes('address in mailbox') ||
    lower.includes('rfc') ||
    lower.includes('syntax')
  ) {
    return 'メールアドレスの形式に問題があります。宛先または送信元メールアドレスを確認してください。';
  }

  if (
    lower.includes('recipient address rejected') ||
    lower.includes('user unknown') ||
    lower.includes('no such user') ||
    lower.includes('550')
  ) {
    return '宛先メールアドレスが存在しない、または受信側に拒否されました。宛先を確認してください。';
  }

  if (lower.includes('relay access denied') || lower.includes('relaying denied')) {
    return 'メールサーバーが送信を許可していません。送信元メール設定を確認してください。';
  }

  if (lower.includes('quota') || lower.includes('rate') || lower.includes('too many')) {
    return 'メール送信数の制限に達している可能性があります。しばらく時間をおいて再度お試しください。';
  }

  return 'メールを送信できませんでした。メール設定または宛先を確認してください。';
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

const textareaCompactStyle: React.CSSProperties = {
  ...textareaStyle,
  minHeight: 120,
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

const sendErrorNoticeStyle: React.CSSProperties = {
  whiteSpace: 'pre-wrap',
  background: '#fff7ed',
  border: '1px solid #fed7aa',
  borderRadius: 8,
  padding: 10,
  fontSize: 13,
  color: '#9a3412',
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
  const [headerText, setHeaderText] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [sendErrorText, setSendErrorText] = useState('');
  const lastAppliedTemplateKeyRef = useRef('');
  const isDefaultBodyManagedRef = useRef(true);
  const isDefaultFooterManagedRef = useRef(true);

  const defaultSubject = useMemo(() => {
    const typeText = inquiryTypeLabel(inquiry?.content ?? '');
    const base = typeText ? `Re: お問い合わせ（${typeText}）` : 'Re: お問い合わせ';
    return inquiry?.id ? `${base} [${inquiry.id}]` : base;
  }, [inquiry?.content, inquiry?.id]);

  const defaultBody = useMemo(() => buildDefaultReplyBody(inquiry), [inquiry?.content, inquiry?.created_at, inquiry?.details]);
  const defaultFooter = useMemo(() => buildDefaultReplyFooter(inquiry), [inquiry?.content, inquiry?.created_at, inquiry?.details]);

  // 初期値（問い合わせが取れたら）
  useEffect(() => {
    setToEmail((inquiry?.email ?? '').toString());
    setSubject(defaultSubject);
  }, [inquiry?.email, defaultSubject]);

  useEffect(() => {
    if (templateId !== '') return;
    if (!isDefaultBodyManagedRef.current) return;
    setBodyText(defaultBody);
  }, [templateId, defaultBody]);

  useEffect(() => {
    if (templateId !== '') return;
    if (!isDefaultFooterManagedRef.current) return;
    setHeaderText('');
    setFooterText(defaultFooter);
  }, [templateId, defaultFooter]);

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
    if (!selectedTemplate) {
      lastAppliedTemplateKeyRef.current = '';
      return;
    }

    const templateKey = `${selectedTemplate.id}:${inquiry?.id ?? ''}`;
    if (lastAppliedTemplateKeyRef.current === templateKey) return;
    lastAppliedTemplateKeyRef.current = templateKey;

    const tplSubject = applyPlaceholders(pickTplSubject(selectedTemplate), inquiry);
    const tplBodyBase = pickTplBody(selectedTemplate);

    // header/footer があるテンプレは合成
    const header = (selectedTemplate.header_template ?? '').toString().trim();
    const footer = (selectedTemplate.footer_template ?? '').toString().trim();

    const tplBody = applyPlaceholders(tplBodyBase, inquiry);
    const tplFooter = composeReplyBody(
      applyPlaceholders(footer, inquiry),
      buildInquiryReference(inquiry),
      ''
    );

    if (tplSubject.trim()) setSubject(tplSubject);
    isDefaultBodyManagedRef.current = false;
    isDefaultFooterManagedRef.current = false;
    setHeaderText(applyPlaceholders(header, inquiry));
    setBodyText(tplBody);
    setFooterText(tplFooter);
  }, [selectedTemplate, inquiry?.id]);

  const onSend = async () => {
    if (!id) return;

    const to = toEmail.trim();
    const subj = subject.trim();
    const body = bodyText;
    const composedBody = composeReplyBody(headerText, body, footerText);
    const draft = {
      templateId,
      toEmail,
      subject,
      headerText,
      bodyText,
      footerText,
    };

    const restoreDraft = () => {
      setTemplateId(draft.templateId);
      setToEmail(draft.toEmail);
      setSubject(draft.subject);
      setHeaderText(draft.headerText);
      setBodyText(draft.bodyText);
      setFooterText(draft.footerText);
    };

    if (!to) return alert('宛先メールアドレスが空です');
    if (!subj) return alert('件名が空です');
    if (!composedBody) return alert('本文が空です');

    if (!confirm('この内容で送信しますか？')) return;

    setSendLoading(true);
    setSendErrorText('');
    try {
      const payload = {
        mail_template_id: templateId === '' ? null : templateId,
        to_email: to,
        subject: subj,
        body_text: composedBody,
      };

      const res = await axios.post(`/api/shop-mail/inquiries/${id}/send`, payload);

      if (res.data?.ok) {
        alert('送信しました');
        await reload();
      } else {
        const friendly = friendlyMailError(res.data?.error ?? res.data?.message);
        setSendErrorText(friendly);
        alert(`送信失敗: ${friendly}`);
        await reload();
        restoreDraft();
      }
    } catch (e: any) {
      const friendly = friendlyMailError(e?.response?.data?.error ?? e?.response?.data?.message ?? e?.message ?? e);
      setSendErrorText(friendly);
      alert(`送信失敗: ${friendly}`);
      restoreDraft();
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
                    {friendlyMailError(r.error_message)}
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
                  if (v === '') {
                    setTemplateId('');
                    setSubject(defaultSubject);
                    isDefaultBodyManagedRef.current = true;
                    isDefaultFooterManagedRef.current = true;
                    setHeaderText('');
                    setBodyText(defaultBody);
                    setFooterText(defaultFooter);
                    setSendErrorText('');
                    return;
                  }

                  isDefaultBodyManagedRef.current = false;
                  isDefaultFooterManagedRef.current = false;
                  setTemplateId(Number(v));
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
              <div className="form-label-text">ヘッダー</div>
              <textarea
                value={headerText}
                onChange={(e) => {
                  setHeaderText(e.target.value);
                }}
                style={textareaCompactStyle}
              />
            </div>

            <div>
              <div className="form-label-text">本文</div>
              <textarea
                value={bodyText}
                onChange={(e) => {
                  isDefaultBodyManagedRef.current = false;
                  setBodyText(e.target.value);
                }}
                style={textareaStyle}
              />
            </div>

            <div>
              <div className="form-label-text">フッター</div>
              <textarea
                value={footerText}
                onChange={(e) => {
                  isDefaultFooterManagedRef.current = false;
                  setFooterText(e.target.value);
                }}
                style={textareaCompactStyle}
              />
            </div>

            <div className="flex gap-2">
              <button className="btn btn-primary" type="button" onClick={onSend} disabled={sendLoading}>
                {sendLoading ? '送信中...' : '送信'}
              </button>
            </div>

            {sendErrorText ? (
              <div style={sendErrorNoticeStyle}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>送信できませんでした</div>
                <div>{sendErrorText}</div>
                <div style={{ marginTop: 4 }}>入力した本文は残しています。</div>
              </div>
            ) : null}
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
                  {friendlyMailError((openRow as any).error_message)}
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
