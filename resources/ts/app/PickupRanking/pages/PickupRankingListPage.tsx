// 更新: resources/ts/app/PickupRanking/pages/PickupRankingListPage.tsx

import React, { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { PageWrapper, BoxConditions, TableWrapper, Forms, appConfirm, appAlert } from '@/components';
import { useComposing } from '@/uses';
import { usePickupRankingListPage } from '@/app/PickupRanking/uses/usePickupRankingListPage';

type RowType = 'manual' | 'pv' | 'inactive';

type ViewRow = {
  item_code?: string;
  item_name?: string;
  pv_count?: number;

  // どちらが来ても拾えるようにする（移行混在対策）
  manual_priority?: number | null;
  sort_order?: number | null;

  is_enabled?: boolean;

  pickup_ranking_id?: number | null;
  can_delete?: boolean;

  // サーバが返すAUTO判定（PV由来の無効オーバーライド）
  is_auto_pv?: boolean;

  // computed
  pickupRankingId: number | null;
  isManualRow: boolean; // “手動レコード（AUTO除外）”
  canReorder: boolean;  // 手動のみ
  canEdit: boolean;     // 手動のみ
  canDelete: boolean;   // 手動のみ（+can_delete）
  rowType: RowType;
};

export const PickupRankingListPage: React.VFC = () => {
  const title = '注目ランキングマスタ';
  const slug = 'pickup_ranking';

  const {
    isLoading,
    state,
    conditions,
    addDetail,
    onChange,
    onClickSearchButton,
    onClickClearButton,
    onChangePage,
    onClickToggle,
    onClickDeleteManual,
    // ★既存の onClickMoveUp/Down は「表示の並び」とズレるので使わない
  } = usePickupRankingListPage(slug);

  const { composing, onCompositionStart, onCompositionEnd } = useComposing();

  const tables = useMemo(() => {
    const rowTypeOrder: Record<RowType, number> = {
      manual: 0,
      pv: 1,
      inactive: 2,
    };

    const rowsWithType: ViewRow[] = (state.rows || []).map((raw: any) => {
      const pickupRankingId = (raw.pickup_ranking_id ?? null) as number | null;
      const isAutoPv = raw.is_auto_pv === true;

      // ★AUTOは「手動扱い」にしない（PV由来の無効オーバーライド）
      const isManualRow = !isAutoPv && (pickupRankingId != null || raw.can_delete === true);

      const isEnabled = raw.is_enabled === true;

      // baseType（手動 or PV）
      const baseType: RowType = isManualRow ? 'manual' : 'pv';

      // 無効はグレー（AUTOで無効になっているPVもここに入る）
      const rowType: RowType = !isEnabled ? 'inactive' : baseType;

      return {
        ...raw,
        pickupRankingId,
        isManualRow,
        canReorder: isManualRow && pickupRankingId != null,
        canEdit: isManualRow && pickupRankingId != null,
        canDelete: isManualRow && pickupRankingId != null && raw.can_delete === true,
        rowType,
      } as ViewRow;
    });

    // ★表示順の値（manual_priority / sort_order どちらでも）
    const getOrderValue = (r: ViewRow): number | null => {
      const v =
        r.manual_priority !== null && r.manual_priority !== undefined
          ? r.manual_priority
          : r.sort_order !== null && r.sort_order !== undefined
            ? r.sort_order
            : null;

      if (v === null) return null;

      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    // 表示安定化（手動は manual_priority(or sort_order)、PVは pv_count）
    rowsWithType.sort((a, b) => {
      const t1 = rowTypeOrder[a.rowType];
      const t2 = rowTypeOrder[b.rowType];
      if (t1 !== t2) return t1 - t2;

      const nameCmp = String(a.item_name ?? '').localeCompare(String(b.item_name ?? ''), 'ja');
      const codeCmp = String(a.item_code ?? '').localeCompare(String(b.item_code ?? ''), 'ja');

      if (a.rowType === 'manual' && b.rowType === 'manual') {
        const s1raw = getOrderValue(a);
        const s2raw = getOrderValue(b);
        const s1 = s1raw === null ? Number.MAX_SAFE_INTEGER : s1raw;
        const s2 = s2raw === null ? Number.MAX_SAFE_INTEGER : s2raw;
        if (s1 !== s2) return s1 - s2;
        if (nameCmp !== 0) return nameCmp;
        return codeCmp;
      }

      if (a.rowType === 'pv' && b.rowType === 'pv') {
        const c1 = Number(a.pv_count ?? 0);
        const c2 = Number(b.pv_count ?? 0);
        if (c1 !== c2) return c2 - c1;
        if (nameCmp !== 0) return nameCmp;
        return codeCmp;
      }

      // inactive は名前/codeで安定化
      if (nameCmp !== 0) return nameCmp;
      return codeCmp;
    });

    /**
     * ★この画面で表示している順序に合わせて reorder を送る
     * - 「手動かつ有効」のみ並び替え対象（無効は並び替え不可運用）
     * - AUTO（is_auto_pv）は対象外
     */
    const getManualIdsOrdered = (): number[] => {
      return rowsWithType
        .filter((r) => r.rowType === 'manual' && r.canReorder && r.pickupRankingId != null && r.is_enabled === true)
        .map((r) => Number(r.pickupRankingId))
        .filter((v) => Number.isFinite(v)) as number[];
    };

    const reorderSwapAndSend = async (id: number, dir: 'up' | 'down') => {
      const ids = getManualIdsOrdered();
      const idx = ids.findIndex((v) => v === id);
      if (idx < 0) return;

      if (dir === 'up' && idx === 0) return;
      if (dir === 'down' && idx === ids.length - 1) return;

      const next = [...ids];
      if (dir === 'up') {
        [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      } else {
        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      }

      await axios.post(`/api/${slug}/reorder`, { ids: next });
    };

    const rowClassMap: Record<RowType, string> = {
      manual: 'row-is-current',
      pv: 'row-is-expired',
      inactive: 'row-inactive',
    };

    const tbody = rowsWithType.map((r, idx) => {
      const pv = Number(r.pv_count ?? 0);
      const manualId = r.pickupRankingId;

      const itemCode = String(r.item_code ?? '').trim();
      const isEnabled = r.is_enabled === true;
      const isAutoPv = r.is_auto_pv === true;

      // ★PV由来（AUTO含む）は item_code でトグル可能（confirm無し）
      const canToggleByCode = (manualId == null || isAutoPv) && itemCode !== '';

      // ★表示順（手動のみ）: manual_priority / sort_order フォールバック
      const orderVal = r.isManualRow ? getOrderValue(r) : null;

      return (
        <tr key={`${r.item_code ?? 'no-code'}-${manualId ?? 'pv'}-${idx}`} className={rowClassMap[r.rowType]}>
          <td className="col-num">{idx + 1}</td>
          <td>{r.item_code}</td>
          <td>{r.item_name}</td>
          <td className="col-num">{pv}</td>

          {/* ★表示順（手動のみ） */}
          <td className="col-num">{r.isManualRow ? (orderVal ?? '') : ''}</td>

          {/* 有効/無効 */}
          <td className="col-btn">
            {r.isManualRow && manualId != null ? (
              <button
                type="button"
                className="btn-toggle"
                onClick={async () => {
                  try {
                    await onClickToggle(manualId, r.is_enabled === false);
                    onClickSearchButton();
                  } catch (e) {
                    await appAlert('切り替えに失敗しました。');
                  }
                }}
              >
                {isEnabled ? '有効' : '無効'}
              </button>
            ) : canToggleByCode ? (
              <button
                type="button"
                className="btn-toggle"
                onClick={async () => {
                  try {
                    const res = await axios.post(`/api/${slug}/toggle-active-by-code`, {
                      item_code: itemCode,
                    });
                    if (res?.data?.success !== true) {
                      await appAlert('切り替えに失敗しました。');
                      return;
                    }
                    onClickSearchButton();
                  } catch (e) {
                    await appAlert('切り替えに失敗しました。');
                  }
                }}
              >
                {isEnabled ? '有効' : '無効'}
              </button>
            ) : (
              <span>—</span>
            )}
          </td>

          {/* 並替（手動かつ有効のみ） */}
          <td className="col-btn">
            {r.rowType === 'manual' && r.canReorder && manualId != null ? (
              <>
                <button
                  type="button"
                  className="btn"
                  onClick={async () => {
                    try {
                      await reorderSwapAndSend(manualId, 'up');
                      onClickSearchButton();
                    } catch (e) {
                      await appAlert('並び替えに失敗しました。');
                    }
                  }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn ml-1"
                  onClick={async () => {
                    try {
                      await reorderSwapAndSend(manualId, 'down');
                      onClickSearchButton();
                    } catch (e) {
                      await appAlert('並び替えに失敗しました。');
                    }
                  }}
                >
                  ↓
                </button>
              </>
            ) : (
              <span>—</span>
            )}
          </td>

          {/* 編集（手動のみ） */}
          <td className="col-btn">
            {r.canEdit && manualId != null ? <Link to={`/${slug}/detail/${manualId}`}>編集</Link> : <span>—</span>}
          </td>

          {/* 削除（手動のみ） */}
          <td className="col-btn">
            {r.isManualRow && manualId != null ? (
              <button
                type="button"
                className="btn"
                disabled={!r.canDelete}
                onClick={async () => {
                  if (!r.canDelete) return;

                  const ok = await appConfirm(`「${r.item_name ?? ''}」を手動登録から削除します。よろしいですか？`);
                  if (!ok) return;

                  try {
                    await onClickDeleteManual(manualId);
                    await appAlert('削除しました。');
                    onClickSearchButton();
                  } catch (e) {
                    await appAlert('削除に失敗しました。');
                  }
                }}
              >
                削除
              </button>
            ) : (
              <span>—</span>
            )}
          </td>
        </tr>
      );
    });

    return (
      <table>
        <thead>
          <tr>
            <th className="col-num">
              <div
                className="tooltip"
                data-tooltip="ショップで表示する順序"
              >
                No
              </div>
            </th>
            <th>
              <div
                className="tooltip"
                data-tooltip="対象商品の商品コード"
              >
                商品コード
              </div>
            </th>
            <th>
              <div
                className="tooltip"
                data-tooltip="対象商品の商品名"
              >
                商品名
              </div>
            </th>
            <th className="col-num">
              <div
                className="tooltip"
                data-tooltip="ショップでの商品詳細ページの閲覧数"
              >
                PV数
              </div>
            </th>
            <th className="col-num">
              <div
                className="tooltip"
                data-tooltip="手動入力した注目ラインキングの並び順"
              >
                表示順
              </div>
            </th>
            <th className="col-btn">有効状態</th>
            <th className="col-btn">並替</th>
            <th className="col-btn">編集</th>
            <th className="col-btn">削除</th>
          </tr>
        </thead>
        <tbody>{tbody}</tbody>
      </table>
    );
  }, [state.rows, onClickToggle, onClickDeleteManual, onClickSearchButton]);

  useEffect(() => {
    onClickSearchButton();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageWrapper prefix={slug} title={title} breadcrumb={[{ name: title }]}>
      <BoxConditions onClickSearchButton={onClickSearchButton} onClickClearButton={onClickClearButton}>
        <Forms.FormGroupInputText
          labelText="文字列"
          name="c_keyword"
          value={conditions.c_keyword}
          onChange={onChange}
          onCompositionStart={onCompositionStart}
          onCompositionEnd={onCompositionEnd}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !composing) {
              onClickSearchButton();
            }
          }}
          maxLength={30}
          groupClassName="max-w-sm"
          removeOptionalLabel
        />
      </BoxConditions>

      {/* 凡例（A案：優先度無し） */}
      <div style={{ display: 'flex', gap: '20px', padding: '10px', margin: '10px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '20px', height: '20px', backgroundColor: '#d4f5d4', border: '1px solid #ccc' }} />
          <span>手動（並び替え可）</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '20px', height: '20px', backgroundColor: '#ffd4d4', border: '1px solid #ccc' }} />
          <span>自動（閲覧数順）</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '20px', height: '20px', backgroundColor: '#e0e0e0', border: '1px solid #ccc' }} />
          <span>無効</span>
        </div>
      </div>

      <TableWrapper pager={state.pager} onChangePage={onChangePage} isLoading={isLoading}>
        {tables}
      </TableWrapper>

      <div className="mt-2">
        <button type="button" className="btn" onClick={addDetail}>
          新規追加
        </button>
      </div>
    </PageWrapper>
  );
};

export default PickupRankingListPage;
