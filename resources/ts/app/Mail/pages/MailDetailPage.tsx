import React, { useMemo, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { PageWrapper } from '@/components';
import { useMailDetailPage } from '@/app/Mail/uses/useMailDetailPage';
import { AutoReplySettingPage } from '@/app/Mail/pages/AutoReplySettingPage';
import { IndividualReplySettingPage } from '@/app/Mail/pages/IndividualReplySettingPage';

const TYPE_AUTO = 1;
const TYPE_INDIV = 2;

const parseTemplateTypeFromQuery = (search: string): number | null => {
  try {
    const qs = new URLSearchParams(search);
    const raw = qs.get('template_type');
    if (!raw) return null;
    const n = Number(raw);
    if (n === TYPE_AUTO || n === TYPE_INDIV) return n;
    return null;
  } catch {
    return null;
  }
};

type UiDetailRow = {
  id?: number;
  key: string;
  displayLabel: string;
  displayMode: number; // 0/1
};

const MODE_HIDE = 0;

/**
 * 明細設定保存用 payload へ変換
 * - m_mail_detail_settings は field_key が本命の可能性が高い
 * - 互換で key_name / code も付与してバック側の期待差を吸収する
 */
const buildDetailSettingsPayload = (rows: UiDetailRow[]) => {
  return rows.map(r => ({
    id: r.id,

    // ✅ 本命（DB/バック側がこれを見ている可能性が高い）
    field_key: r.key,

    // ✅ 互換（バック側が古いキー名で見ていても拾えるように）
    key_name: r.key,
    code: r.key,
    key: r.key,

    display_label: r.displayLabel,
    display_mode: Number(r.displayMode),

    // 互換用（display_mode が無い環境でも最低限動く）
    is_display: Number(r.displayMode) === MODE_HIDE ? 0 : 1,
  }));
};

/**
 * メール設定（詳細）画面
 * - 一覧で自動/個別を分けているため、詳細では種別を表示しない/切替させない
 */
export const MailDetailPage: React.VFC = () => {
  const location = useLocation();
  const [savingAll, setSavingAll] = useState(false);

  const {
    id,
    isDisabled,
    title,
    slug,
    state,
    errors,
    onChange,
    saveClick,
  } = useMailDetailPage();

  const fixedType = useMemo(() => {
    const q = parseTemplateTypeFromQuery(location.search);
    if (q != null) return q;
    const s = Number(state.template_type ?? TYPE_AUTO);
    return s === TYPE_INDIV ? TYPE_INDIV : TYPE_AUTO;
  }, [location.search, state.template_type]);

  const isAuto = fixedType === TYPE_AUTO;

  /**
   * 保存（テンプレ + 明細設定）
   */
  const saveAll = useCallback(async () => {
    if (savingAll) return;

    setSavingAll(true);
    try {
      // 1) テンプレート保存
      await Promise.resolve(saveClick());

      // 2) 明細共通設定 保存
      const rows = state?.detail_settings;

      // ここが空なら「明細UI側が state.detail_settings を onChange していない」状態
      if (Array.isArray(rows) && rows.length > 0) {
        const payload = buildDetailSettingsPayload(rows as UiDetailRow[]);
        await axios.put('/api/shop-mail/detail-settings', payload);
      } else {
        // 失敗ではないが、保存されない原因の切り分けに必要なのでメッセージを出す
        // （運用で不要なら消してOK）
        console.warn('[detail-settings] state.detail_settings is empty. skip saving detail settings.');
      }
    } catch (e) {
      alert('保存に失敗しました。（メールテンプレは保存されている可能性があります）');
    } finally {
      setSavingAll(false);
    }
  }, [saveClick, savingAll, state?.detail_settings]);

  const disabledSave = isDisabled || savingAll;

  return (
    <PageWrapper
      prefix={slug}
      title={title}
      breadcrumb={[
        { name: 'メールテンプレ一覧', url: `/mail` },
        { name: isAuto ? '自動返信メール（詳細）' : '個別返信メール（詳細）' },
      ]}
    >
      <div className="form-group-wrapper">
        {isAuto ? (
          <AutoReplySettingPage
            state={state}
            errors={errors}
            onChange={onChange}
            saveClick={saveClick}
          />
        ) : (
          <IndividualReplySettingPage
            state={state}
            errors={errors}
            onChange={onChange}
            saveClick={saveClick}
          />
        )}
      </div>

      <div className="flex justify-between">
        <div>
          <button className="btn" onClick={saveAll} disabled={disabledSave}>
            {savingAll ? '保存中...' : '保存'}
          </button>
        </div>

        {id && (
          <button className="btn-delete" disabled={disabledSave}>
            削除
          </button>
        )}
      </div>
    </PageWrapper>
  );
};
