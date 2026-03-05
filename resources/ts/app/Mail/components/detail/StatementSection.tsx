// 更新: resources/ts/app/Mail/components/StatementSection.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Forms } from '@/components';

type Props = {
  state: any;
  errors: any;
  onChange: (name: string, value: any) => void;
  saveClick?: (value: any) => void;
};

// display_mode
// 1: 表示
// 0: 非表示
const MODE_SHOW = 1;
const MODE_HIDE = 0;

type DbRow = {
  id?: number;

  // ✅ 本命（あなたの環境で存在しうる）
  field_key?: string;

  // 旧環境互換
  key_name?: string;
  item_key?: string;
  code?: string;
  key?: string;

  display_label?: string;
  is_display?: number;    // fallback
  display_mode?: number;  // preferred
};

type ItemDef = {
  key: string;
  itemLabel: string;
  modes: number[];
  defaultMode: number;
};

const ITEMS: ItemDef[] = [
  { key: 'order_no', itemLabel: 'ご注文番号', modes: [MODE_SHOW], defaultMode: MODE_SHOW },
  { key: 'order_date', itemLabel: '発注日', modes: [MODE_SHOW, MODE_HIDE], defaultMode: MODE_SHOW },
  { key: 'item_code', itemLabel: '商品コード', modes: [MODE_SHOW, MODE_HIDE], defaultMode: MODE_SHOW },
  { key: 'item_name', itemLabel: '商品名', modes: [MODE_SHOW], defaultMode: MODE_SHOW },
  { key: 'model_no', itemLabel: '型番', modes: [MODE_SHOW, MODE_HIDE], defaultMode: MODE_SHOW },
  { key: 'variation', itemLabel: 'バリエーション', modes: [MODE_SHOW, MODE_HIDE], defaultMode: MODE_SHOW },
  { key: 'unit_price_tax_in', itemLabel: '税込単価', modes: [MODE_SHOW], defaultMode: MODE_SHOW },
  { key: 'qty', itemLabel: '注文数', modes: [MODE_SHOW], defaultMode: MODE_SHOW },
  { key: 'subtotal', itemLabel: '小計', modes: [MODE_SHOW], defaultMode: MODE_SHOW },
  { key: 'items_total_tax_in', itemLabel: 'お買い上げ金額(税込)', modes: [MODE_SHOW], defaultMode: MODE_SHOW },
  { key: 'shipping_fee_tax_in', itemLabel: '送料(税込)', modes: [MODE_SHOW], defaultMode: MODE_SHOW },
  { key: 'extra_shipping_tax_in', itemLabel: '別途追加送料(税込)', modes: [MODE_SHOW], defaultMode: MODE_SHOW },
  { key: 'use_points', itemLabel: '利用ポイント数', modes: [MODE_SHOW], defaultMode: MODE_SHOW },
  { key: 'earned_points', itemLabel: '獲得予定ポイント数', modes: [MODE_SHOW, MODE_HIDE], defaultMode: MODE_SHOW },
  { key: 'grand_total', itemLabel: '合計', modes: [MODE_SHOW], defaultMode: MODE_SHOW },
  { key: 'cod_fee_tax_in', itemLabel: '代引き手数料(税込)', modes: [MODE_SHOW], defaultMode: MODE_SHOW },
  { key: 'payment_method', itemLabel: 'お支払方法', modes: [MODE_SHOW], defaultMode: MODE_SHOW },
  { key: 'bank_account', itemLabel: '代金振込口座', modes: [MODE_SHOW, MODE_HIDE], defaultMode: MODE_SHOW },
];

export type UiRow = {
  id?: number;
  key: string;
  itemLabel: string;
  displayLabel: string;
  displayMode: number;
  modes: number[];
};

const pickKey = (r: DbRow): string =>
  // ✅ field_key を最優先で見る（ここが今回の不具合原因）
  (r.field_key || r.key_name || r.item_key || r.code || r.key || '').trim();

const modeLabel = (m: number) => {
  if (m === MODE_SHOW) return '表示';
  return '非表示';
};

export const buildDetailSettingsPayload = (rows: UiRow[]) => {
  return rows.map(r => ({
    id: r.id,
    // ✅ 本命
    field_key: r.key,
    // ✅ 互換
    key_name: r.key,
    code: r.key,
    key: r.key,

    display_label: r.displayLabel,
    display_mode: r.displayMode,
    is_display: r.displayMode === MODE_HIDE ? 0 : 1,
  }));
};

export const StatementSection: React.VFC<Props> = ({ state, errors, onChange }) => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<UiRow[]>([]);
  const [loadError, setLoadError] = useState('');

  const buildDefault = useCallback((): UiRow[] => {
    return ITEMS.map(x => ({
      key: x.key,
      itemLabel: x.itemLabel,
      displayLabel: x.itemLabel,
      displayMode: x.defaultMode,
      modes: x.modes,
    }));
  }, []);

  const reflectToParent = useCallback((next: UiRow[]) => {
    onChange('detail_settings', next);
  }, [onChange]);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setLoadError('');

    try {
      const res = await axios.get('/api/shop-mail/detail-settings');

      // Controller/Serviceの返却形に合わせる
      const dbRows = (res.data?.data?.rows ?? []) as DbRow[];

      const map = new Map<string, DbRow>();
      dbRows.forEach(r => {
        const k = pickKey(r);
        if (k) map.set(k, r);
      });

      const merged: UiRow[] = ITEMS.map(x => {
        const hit = map.get(x.key);

        const modeFromDb =
          hit?.display_mode != null ? Number(hit.display_mode)
          : hit?.is_display != null ? (Number(hit.is_display) === 1 ? MODE_SHOW : MODE_HIDE)
          : x.defaultMode;

        const safeMode = x.modes.includes(modeFromDb) ? modeFromDb : x.defaultMode;

        return {
          id: hit?.id ? Number(hit.id) : undefined,
          key: x.key,
          itemLabel: x.itemLabel,
          displayLabel: String(hit?.display_label ?? x.itemLabel),
          displayMode: safeMode,
          modes: x.modes,
        };
      });

      setRows(merged);
      reflectToParent(merged);
    } catch (e) {
      setLoadError('明細設定の取得に失敗しました。');
      const def = buildDefault();
      setRows(def);
      reflectToParent(def);
    } finally {
      setLoading(false);
    }
  }, [buildDefault, reflectToParent]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // 親が detail_settings を持っていて、こちらより新しい場合は同期（安全策）
  useEffect(() => {
    const fromParent = state?.detail_settings as UiRow[] | undefined;
    if (!fromParent || !Array.isArray(fromParent) || fromParent.length === 0) return;

    // 同じ内容ならスキップ
    if (
      fromParent.length === rows.length &&
      fromParent.every((x, i) => x?.key === rows[i]?.key && x?.displayLabel === rows[i]?.displayLabel && x?.displayMode === rows[i]?.displayMode)
    ) {
      return;
    }

    setRows(fromParent);
  }, [state?.detail_settings]); // eslint-disable-line react-hooks/exhaustive-deps

  const onChangeDisplayLabel = useCallback((key: string, v: any) => {
    setRows(prev => {
      const next = prev.map(r => (r.key === key ? { ...r, displayLabel: String(v ?? '') } : r));
      reflectToParent(next);
      return next;
    });
  }, [reflectToParent]);

  const onChangeMode = useCallback((key: string, mode: number) => {
    setRows(prev => {
      const next = prev.map(r => (r.key === key ? { ...r, displayMode: mode } : r));
      reflectToParent(next);
      return next;
    });
  }, [reflectToParent]);

  const canEdit = useMemo(() => !loading, [loading]);

  if (loading) return <div className="my-2 text-sm">明細設定を読み込み中...</div>;

  return (
    <>
      <div className="flex items-center justify-between mt-3">
        <h3 className="text-base font-bold">お買い上げ明細（共通設定）</h3>
        {/* 単独保存ボタンは削除：MailDetailPage の保存でまとめて保存 */}
      </div>

      {loadError && <div className="mt-2 text-sm text-red-600">{loadError}</div>}

      <div className="mt-2">
        {rows.map(r => (
          <div key={r.key} style={{ display: 'flex', marginTop: '8px', alignItems: 'center' }}>
            <div style={{ width: '674px' }}>
              <Forms.FormGroupInputText
                labelText={r.itemLabel}
                name={`detail_display_label_${r.key}`}
                value={r.displayLabel}
                error={errors?.[`detail_display_label_${r.key}`] ?? undefined}
                onChange={(_, v) => onChangeDisplayLabel(r.key, v)}
                groupClassName="mt-0"
                className="max-w-lg"
                maxLength={255}
                removeOptionalLabel
                disabled={!canEdit}
              />
            </div>

            <div className="ml-2" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {r.modes.map(mode => (
                <Forms.FormInputRadio
                  key={`${r.key}_${mode}`}
                  className="ml-2"
                  labelText={modeLabel(mode)}
                  name={`detail_mode_${r.key}`}
                  id={`detail_mode_${r.key}_${mode}`}
                  checked={Number(r.displayMode) === mode}
                  disabled={!canEdit || r.modes.length === 1}
                  onChange={() => onChangeMode(r.key, mode)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
