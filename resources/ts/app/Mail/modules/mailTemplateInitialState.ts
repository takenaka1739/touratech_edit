// 新規作成
// パス: resources/ts/app/Mail/modules/mailTemplateInitialState.ts

/**
 * MailTemplate 初期値（暫定）
 * 以前このファイルが存在していた前提で TypeScript が参照しているため、
 * ビルド/型エラー解消のために復活。
 *
 * 実運用のキーは m_mail_templates（MailTemplateService）に合わせる:
 * - template_type, name, subject_template, header_template, footer_template,
 *   detail_mode, payment_url_enabled, shipping_text, is_active
 */

export type MailTemplateState = {
  id: number | null;
  template_type: number; // 0=自動返信テンプレ, 1=個別返信テンプレ
  name: string;
  subject_template: string;
  header_template: string;
  footer_template: string;
  shipping_text: string;
  detail_mode: number;
  payment_url_enabled: number;
  is_active: number;
};

export const mailTemplateInitialState: MailTemplateState = {
  id: null,
  template_type: 0,
  name: '',
  subject_template: '',
  header_template: '',
  footer_template: '',
  shipping_text: '',
  detail_mode: 0,
  payment_url_enabled: 0,
  is_active: 1,
};