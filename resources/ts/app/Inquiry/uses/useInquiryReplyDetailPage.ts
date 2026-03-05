// 更新: resources/ts/app/Inquiry/uses/useInquiryReplyDetailPage.ts
import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

type Inquiry = {
  id: number;
  customer_name?: string | null;
  email?: string | null;
  content?: string | number | null;
  details?: string | null;
  is_public?: number | boolean | null;
  created_at?: string | null;
};

export type InquiryHistoryRow = {
  id: number;
  subject?: string | null;
  body_text?: string | null;
  reply_content?: string | null;
  to_email?: string | null;
  send_status?: number | null;
  error_message?: string | null;
  reply_at?: string | null;
  created_at?: string | null;
  mail_template_id?: number | null;
};

export type MailTemplateRow = {
  id: number;
  // フロント表示用（理想はバックで title as name を返す）
  name?: string | null;
  title?: string | null;

  subject_template?: string | null;
  header_template?: string | null;
  footer_template?: string | null;
};

type SendPayload = {
  mail_template_id?: number | null;
  to_email: string;
  subject: string;
  body_text: string;
};

const normalizeTemplateList = (resData: any): MailTemplateRow[] => {
  // Controller が { success, data: { rows } } の形
  const list =
    resData?.rows ??
    resData?.data?.rows ??
    resData?.data?.templates ??
    resData?.templates ??
    resData?.data ??
    resData ??
    [];

  const arr = Array.isArray(list) ? list : [];

  // name が無い環境でも title を表示に使えるように寄せる
  return arr.map((t: any) => ({
    id: Number(t?.id),
    name: (t?.name ?? t?.title ?? '').toString() || null,
    title: t?.title ?? null,
    subject_template: t?.subject_template ?? null,
    header_template: t?.header_template ?? null,
    footer_template: t?.footer_template ?? null,
  }));
};

export const useInquiryReplyDetailPage = (inquiryId: number) => {
  const [isLoading, setLoading] = useState(false);
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [rows, setRows] = useState<InquiryHistoryRow[]>([]);

  const [templates, setTemplates] = useState<MailTemplateRow[]>([]);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!inquiryId || Number.isNaN(inquiryId)) return;

    setLoading(true);
    try {
      const res = await axios.get(`/api/shop-mail/inquiries/${inquiryId}/messages`);
      setInquiry(res.data?.inquiry ?? null);
      setRows(res.data?.rows ?? []);
    } finally {
      setLoading(false);
    }
  }, [inquiryId]);

  const fetchTemplates = useCallback(async () => {
    const res = await axios.get('/api/shop-mail/templates');

    // index がラップしていても / 直返しでも吸収
    const normalized = normalizeTemplateList(res.data);

    setTemplates(normalized);
  }, []);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const reload = useCallback(() => {
    fetchDetail();
  }, [fetchDetail]);

  const sendReply = useCallback(
    async (payload: SendPayload) => {
      if (!inquiryId || Number.isNaN(inquiryId)) return { ok: false, message: 'invalid inquiry id' };

      setSending(true);
      setSendError(null);
      try {
        const res = await axios.post(`/api/shop-mail/inquiries/${inquiryId}/send`, payload);

        // InquiryReplyService は { ok: boolean, ... } 形式
        const ok = !!res.data?.ok;

        if (!ok) {
          const msg = (res.data?.message ?? res.data?.error ?? '送信に失敗しました').toString();
          setSendError(msg);
          return { ok: false, message: msg, data: res.data };
        }

        await fetchDetail();
        return { ok: true, data: res.data };
      } catch (e: any) {
        const msg =
          e?.response?.data?.message ??
          e?.response?.data?.error ??
          e?.message ??
          '送信に失敗しました';
        setSendError(String(msg));
        return { ok: false, message: String(msg) };
      } finally {
        setSending(false);
      }
    },
    [inquiryId, fetchDetail]
  );

  const lastReply = useMemo(() => {
    if (!rows || rows.length === 0) return null;
    return rows[rows.length - 1] ?? null;
  }, [rows]);

  return {
    isLoading,
    inquiry,
    rows,
    reload,

    templates,
    sending,
    sendError,
    sendReply,

    lastReply,
  };
};