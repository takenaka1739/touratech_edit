// 更新: resources/ts/app/Inquiry/pages/EcMailConversationPage.tsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { MailPageWrapper } from '../components/detail/MailPageWrapper';
import { TableWrapper } from '@/components';

type HistoryRow = {
  id: number;
  subject?: string | null;
  created_at?: string | null;
  send_status?: number | null; // 1=成功 / 0=失敗 など想定（環境差はバッジ側で吸収）
  error_message?: string | null;
  body_text?: string | null;
  reply_content?: string | null;
  to_email?: string | null;
};

type TemplateRow = {
  id: number;
  title?: string | null; // m_mail_templates は title
  name?: string | null; // 念のため互換

  subject_template?: string | null;
  header_template?: string | null;
  footer_template?: string | null;

  // 旧/互換
  subject?: string | null;
  body_text?: string | null;
  body?: string | null;
};

const pickTplTitle = (t: TemplateRow) => (t.title ?? t.name ?? `template#${t.id}`).toString();
const pickTplSubject = (t: TemplateRow) => (t.subject_template ?? t.subject ?? '').toString();
const pickTplBody = (t: TemplateRow) => (t.body_text ?? t.body ?? '').toString();

/** YYYY/MM/DD HH:MM だけに整形（ISO/DB timestamp でもOK） */
const toYmdHm = (v: any): string => {
  const s = (v ?? '').toString().trim();
  if (!s) return '';
  const m = s.match(/^(\d{4})[-/](\d{2})[-/](\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (!m) return s;
  const ymd = `${m[1]}/${m[2]}/${m[3]}`;
  if (m[4] && m[5]) return `${ymd} ${m[4]}:${m[5]}`;
  return ymd;
};

// EC側は問い合わせ情報が無いので置換は将来拡張用に空でOK
const applyPlaceholders = (text: string, _ctx: any) => {
  return (text || '')
    .replaceAll('{CUSTOMER_NAME}', '')
    .replaceAll('{EMAIL}', '')
    .replaceAll('{INQUIRY_SUBJECT}', '')
    .replaceAll('{INQUIRY_BODY}', '');
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

const statusBadgeStyle = (send_status: any): React.CSSProperties => {
  const n = Number(send_status);
  const ok = n === 1 || n === 200;
  return {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: 'nowrap',
    background: ok ? '#dcfce7' : '#fee2e2',
    color: ok ? '#166534' : '#991b1b',
    border: ok ? '1px solid #86efac' : '1px solid #fecaca',
  };
};

const statusLabel = (send_status: any) => {
  const n = Number(send_status);
  if (n === 1 || n === 200) return '成功';
  if (n === 0) return '失敗';
  if (send_status === null || send_status === undefined || send_status === '') return '';
  return String(send_status);
};

// ===== レイアウト固定（このページ内だけで崩れを止める） =====
const styles: Record<string, React.CSSProperties> = {
  pageGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 12,
  },
  // フォームを「ラベル列 + 入力列」で固定
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '160px 1fr',
    columnGap: 12,
    rowGap: 10,
    alignItems: 'center',
  },
  formLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: '#374151',
    textAlign: 'right',
    whiteSpace: 'nowrap',
  },
  // 入力欄は確実に枠線をつける（共通CSSが効かなくてもOK）
  control: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #d1d5db',
    background: '#fff',
    borderRadius: 6,
    padding: '8px 10px',
    fontSize: 14,
    lineHeight: 1.4,
  },
  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #d1d5db',
    background: '#fff',
    borderRadius: 6,
    padding: '10px 10px',
    fontSize: 14,
    lineHeight: 1.5,
    resize: 'vertical',
    minHeight: 220,
  },
  helpText: {
    gridColumn: '2 / -1',
    fontSize: 12,
    color: '#6b7280',
    marginTop: -6,
  },
  actionsRow: {
    gridColumn: '2 / -1',
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontWeight: 800,
    marginBottom: 10,
  },
  tableWrap: {
    overflowX: 'auto',
  },
};

export const EcMailConversationPage: React.VFC = () => {
  const { id } = useParams<{ id: string }>();
  const receiveOrderId = Number(id);

  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(false);

  // ===== 履歴モーダル =====
  const [openId, setOpenId] = useState<number | null>(null);
  const openRow = useMemo(() => {
    if (openId === null) return null;
    return (rows ?? []).find((r) => Number(r.id) === openId) ?? null;
  }, [openId, rows]);

  const bodyTextModal = useMemo(() => {
    if (!openRow) return '';
    return (openRow.body_text ?? openRow.reply_content ?? '').toString();
  }, [openRow]);

  // ===== テンプレ & 返信フォーム =====
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [tplLoading, setTplLoading] = useState(false);

  const [templateId, setTemplateId] = useState<number | ''>('');
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [sendLoading, setSendLoading] = useState(false);

  const defaultSubject = useMemo(() => {
    return receiveOrderId
      ? `Re: ご注文関連のお問い合わせ [受注ID:${receiveOrderId}]`
      : 'Re: ご注文関連のお問い合わせ';
  }, [receiveOrderId]);

  const fetchData = useCallback(async () => {
    if (!receiveOrderId || Number.isNaN(receiveOrderId)) return;

    setLoading(true);
    try {
      const res = await axios.get(`/api/shop-mail/orders/${receiveOrderId}/messages`);
      setRows(res.data?.rows ?? []);
    } finally {
      setLoading(false);
    }
  }, [receiveOrderId]);

  useEffect(() => {
    if (!rows || rows.length === 0) return;

    // すでに入力されている場合は上書きしない
    if (toEmail && toEmail.trim() !== '') return;

    const firstMail = rows[0];
    if (firstMail?.to_email) {
      setToEmail(firstMail.to_email);
    }
  }, [rows]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  useEffect(() => {
    setSubject(defaultSubject);
  }, [defaultSubject]);

  useEffect(() => {
    if (!selectedTemplate) return;

    const ctx = {};

    const tplSubject = applyPlaceholders(pickTplSubject(selectedTemplate), ctx);
    const tplBodyBase = pickTplBody(selectedTemplate);

    const header = (selectedTemplate.header_template ?? '').toString().trim();
    const footer = (selectedTemplate.footer_template ?? '').toString().trim();

    const composed = [header, tplBodyBase, footer]
      .filter((v) => (v ?? '').toString().trim() !== '')
      .join('\n\n');

    const tplBody = applyPlaceholders(composed, ctx);

    if (tplSubject.trim()) setSubject(tplSubject);
    setBodyText(tplBody);
  }, [selectedTemplate]);

  const onSend = async () => {
    if (!receiveOrderId) return;

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

      // ルートは環境に合わせて
      const res = await axios.post(`/api/shop-mail/orders/${receiveOrderId}/send`, payload);

      if (res.data?.ok || res.data?.success) {
        alert('送信しました');
      } else {
        alert(`送信失敗: ${friendlyMailError(res.data?.error ?? res.data?.message)}`);
      }

      await fetchData();
    } catch (e: any) {
      alert(`送信失敗: ${friendlyMailError(e?.response?.data?.error ?? e?.response?.data?.message ?? e?.message ?? e)}`);
      await fetchData();
    } finally {
      setSendLoading(false);
    }
  };

  const historyTable = useMemo(() => {
    return (
      <div style={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>件名</th>
              <th className="col-amount">送信日時</th>
              <th className="col-amount">送信状態</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((r) => (
              <tr key={r.id}>
                <td style={{ textAlign: 'left' }}>
                  <button type="button" className="link" onClick={() => setOpenId(Number(r.id))}>
                    {r.subject ?? '(件名なし)'}
                  </button>
                </td>
                <td className="col-amount" style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                  {toYmdHm(r.created_at ?? '')}
                </td>
                <td className="col-amount" style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                  <span style={statusBadgeStyle(r.send_status)}>{statusLabel(r.send_status)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }, [rows]);

  return (
    <MailPageWrapper
      prefix="shop-mail"
      title="個別返信メール送信"
      breadcrumb={[
        { name: 'EC購入メール履歴', url: '/inquiry_mail' },
        { name: 'メール履歴詳細' },
      ]}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex gap-2">
          <Link className="btn" to="/inquiry_mail">
            一覧へ戻る
          </Link>
          <button className="btn" type="button" onClick={fetchData} disabled={loading}>
            再読み込み
          </button>
        </div>
      </div>

      <div style={styles.pageGrid}>
        {/* ===== 返信フォーム（カード化） ===== */}
        <div className="card p-3">
          <div style={styles.sectionTitle}>個別返信メール送信</div>

          <div style={styles.formGrid}>
            {/* テンプレ */}
            <div style={styles.formLabel}>テンプレ</div>
            <div>
              <select
                className="form-select"
                style={styles.control}
                value={templateId}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '') {
                    setTemplateId('');
                    setSubject(defaultSubject);
                    setBodyText('');
                    return;
                  }

                  setTemplateId(Number(v));
                }}
                disabled={tplLoading}
              >
                <option value="">（選択なし）</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {pickTplTitle(t)}
                  </option>
                ))}
              </select>
            </div>

            {/* 宛先 */}
            <div style={styles.formLabel}>宛先</div>
            <div>
              <input
                className="form-control"
                style={styles.control}
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="例: customer@example.com"
              />
            </div>

            {/* 件名 */}
            <div style={styles.formLabel}>件名</div>
            <div>
              <input
                className="form-control"
                style={styles.control}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            {/* 本文 */}
            <div style={styles.formLabel}>本文</div>
            <div>
              <textarea
                className="form-control"
                style={styles.textarea}
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
              />
            </div>

            {/* 送信ボタン */}
            <div style={styles.actionsRow}>
              <button className="btn btn-primary" type="button" onClick={onSend} disabled={sendLoading}>
                {sendLoading ? '送信中...' : '送信'}
              </button>
            </div>
          </div>
        </div>

        {/* ===== メール履歴（カード化） ===== */}
        <div className="card p-3">
          <div style={styles.sectionTitle}>メール履歴</div>
          <TableWrapper pager={undefined} onChangePage={() => {}} isLoading={loading}>
            {historyTable}
          </TableWrapper>
        </div>
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
            className="card p-3"
            style={{ width: 'min(900px, 100%)', maxHeight: '80vh', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <div style={{ fontWeight: 800 }}>{openRow.subject ?? '(件名なし)'}</div>
              <button className="btn" type="button" onClick={() => setOpenId(null)}>
                閉じる
              </button>
            </div>

            {openRow.error_message ? (
              <div
                style={{
                  background: '#fee2e2',
                  color: '#991b1b',
                  padding: 10,
                  marginBottom: 10,
                  borderRadius: 8,
                  whiteSpace: 'pre-wrap',
                  border: '1px solid #fecaca',
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: 4 }}>送信失敗理由</div>
                {friendlyMailError(openRow.error_message)}
              </div>
            ) : null}

            <div
              style={{
                whiteSpace: 'pre-wrap',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
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
