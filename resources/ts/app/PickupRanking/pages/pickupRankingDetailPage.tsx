// 更新: resources/ts/app/PickupRanking/pages/pickupRankingDetailPage.tsx

import React, { useEffect, useMemo } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import axios from 'axios';
import { PageWrapper, Forms, appAlert } from '@/components';
import { useCommonDetailPage } from '@/app/App/uses/useCommonDetailPage';

import { useItemSelectModal } from '@/app/Coupon/uses/useItemSelectModal';
import { ItemSelectModal } from '@/app/PickupRanking/components/ItemSelectModal';

export type PickupRankingDetailPageProps = {} & RouteComponentProps<{ id: string }>;

type PickupRankingState = {
  prev_url?: string;
  prev_title?: string;

  item_id?: number;
  item_number?: string;
  item_name?: string;

  // 表示順は manual_priority に統一（新規でも入力できる）
  manual_priority?: number;

  // memo を使うなら追加（現状UI無しなので保持だけでもOK）
  // memo?: string;
};

export const PickupRankingDetailPage: React.VFC<PickupRankingDetailPageProps> = () => {
  const title = '注目ランキング';
  const slug = 'pickup_ranking';

  const initialState: PickupRankingState = useMemo(
    () => ({
      prev_title: title,
      prev_url: `/${slug}`,
      item_id: undefined,
      item_number: '',
      item_name: '',
      manual_priority: undefined,
    }),
    [slug],
  );

  const {
    isLoading,
    id,
    state,
    setState,
    errors,
    setErrors,
    onChange,
    onClickSave,
    onClickDelete,
  } = useCommonDetailPage<PickupRankingState>(slug, initialState) as any;

  const safeId: number | undefined = useMemo(() => {
    const n = Number(id);
    return Number.isFinite(n) ? n : undefined;
  }, [id]);

  const itemModal = useItemSelectModal();

  const patchState = (patch: Partial<PickupRankingState>) => {
    setState((prev: PickupRankingState) => ({ ...prev, ...patch }));

    if (setErrors) {
      setErrors((prevErr: any) => ({
        ...(prevErr ?? {}),
        ...Object.keys(patch).reduce((acc, k) => {
          acc[k] = '';
          return acc;
        }, {} as any),
      }));
    }
  };

  useEffect(() => {
    const current = (state as any)?.item_id;
    const n = Number(current);
    if (Number.isFinite(n) && n > 0) {
      itemModal.setSelected([n]);
    } else {
      itemModal.setSelected([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(state as any)?.item_id]);

  const selectedItemLabel = useMemo(() => {
    const n = (state as any)?.item_number ?? '';
    const name = (state as any)?.item_name ?? '';
    if (!n && !name) return '';
    if (n && name) return `${n} / ${name}`;
    return n || name;
  }, [state]);

  // manual_priority 表示値（number|undefined）
  const manualPriorityNumber: number | undefined = useMemo(() => {
    const v = (state as any)?.manual_priority;
    if (v === null || v === undefined || v === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }, [(state as any)?.manual_priority]);

  // FormInputNumber の onChange 形式吸収
  const handleManualPriorityChange = (...args: any[]) => {
    // 形式A: onChange(name, value)
    if (args.length >= 2 && typeof args[0] === 'string') {
      const name = args[0];
      const value = args[1];

      if (value === '' || value === null || value === undefined) {
        onChange(name, undefined);
        return;
      }

      const n = Number(value);
      onChange(name, Number.isFinite(n) ? n : undefined);
      return;
    }

    // 形式B: onChange(event)
    const e = args[0];
    const raw = e?.target?.value;

    if (raw === '' || raw === null || raw === undefined) {
      onChange('manual_priority', undefined);
      return;
    }

    const n = Number(raw);
    onChange('manual_priority', Number.isFinite(n) ? n : undefined);
  };

  /**
   * 商品選択（単一）
   * - 既に手動登録済みの code を選んだら警告（新規時だけ）
   */
  const handleConfirmItem = async (pickedId: number | null) => {
    if (!pickedId) {
      itemModal.confirm([]);
      patchState({
        item_id: undefined,
        item_number: '',
        item_name: '',
      });
      return;
    }

    itemModal.confirm([pickedId]);

    try {
      const res = await axios.get(`/api/pickup_ranking/item/${pickedId}`);
      const row = res?.data?.data ?? null;

      const itemNumber = row?.item_number ?? row?.code ?? '';
      const itemName = row?.name ?? '';
      const itemCode = String(row?.code ?? '').trim();

      // ★新規作成時のみ：同一codeの手動登録があるなら警告（Controller/Service でも 422 で弾かれるが、UX向上）
      if (safeId === undefined && itemCode) {
        try {
          const chk = await axios.post(`/api/${slug}/fetch`, { c_keyword: itemCode, page: 1 });
          const rows = chk?.data?.data?.rows ?? [];
          const existsManual = Array.isArray(rows)
            ? rows.some((r: any) => String(r?.item_code ?? '') === itemCode && r?.pickup_ranking_id != null)
            : false;

          if (existsManual) {
            await appAlert('登録済み商品です（同一商品コードが手動登録されています）。');
          }
        } catch {
          // チェック失敗しても致命ではないので無視
        }
      }

      patchState({
        item_id: pickedId,
        item_number: itemNumber,
        item_name: itemName,
      });
    } catch (e) {
      patchState({
        item_id: pickedId,
        item_number: '',
        item_name: '',
      });
    }
  };

  const prevUrl: string | undefined =
    typeof (state as any)?.prev_url === 'string' ? (state as any).prev_url : undefined;

  const prevTitle: string =
    typeof (state as any)?.prev_title === 'string' && (state as any)?.prev_title
      ? (state as any).prev_title
      : title;

  const selectedItemId: number | null = useMemo(() => {
    const v = (state as any)?.item_id;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [(state as any)?.item_id]);

  /**
   * ★二重confirm回避
   * - onClickSave / onClickDelete 側（useCommonDetailPage）に確認を一本化
   */
  const handleSave = async () => {
    try {
      await onClickSave?.();
      // hook側が成功通知を出すならここは不要。必要なら残してOK。
      // await appAlert('保存しました。');
    } catch {
      await appAlert('保存に失敗しました。');
    }
  };

  const handleDelete = async () => {
    try {
      await onClickDelete?.();
    } catch {
      await appAlert('削除に失敗しました。');
    }
  };

  return (
    <PageWrapper
      prefix={`${slug}-detail`}
      title={`${title}詳細`}
      breadcrumb={[
        { name: prevTitle, url: prevUrl },
        { name: `${title}詳細` },
      ]}
      isLoading={isLoading}
    >
      <div className="form-group-wrapper">
        <Forms.FormGroup labelText="対象商品" error={(errors as any)?.item_id} required>
          <div className="flex items-center max-w-3xl">
            <div className="flex-grow">
              <Forms.FormInputText name="item_display" value={selectedItemLabel} className="w-full" readOnly />
              <input type="hidden" name="item_id" value={(state as any)?.item_id ?? ''} />
            </div>

            <button className="btn ml-2 py-0 px-2" type="button" onClick={itemModal.open}>
              ...
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-1">※「...」から商品を検索して選択してください</div>
        </Forms.FormGroup>

        <ItemSelectModal
          isOpen={itemModal.isOpen}
          onClose={itemModal.close}
          onConfirm={handleConfirmItem}
          selectedItemId={selectedItemId}
        />

        {/* ★新規でも入力可：表示順（manual_priority） */}
        <div className="flex max-w-2xl">
          <div className="w-2/5">
            <Forms.FormGroup labelText="表示順（手動）" error={(errors as any)?.manual_priority}>
              <Forms.FormInputNumber
                name="manual_priority"
                value={manualPriorityNumber}
                onChange={handleManualPriorityChange as any}
                precision={0}
                className="max-w-12 text-right"
                min={1}
              />
              <div className="text-xs text-gray-500 mt-1">
                ※数字が小さいほど上になります。未入力の場合は末尾に追加されます。
              </div>
            </Forms.FormGroup>
          </div>
          <div className="w-3/5" />
        </div>
      </div>

      <div className="flex justify-between">
        <div className="flex items-center">
          <button className="btn" onClick={handleSave} type="button">
            保存
          </button>
        </div>

        {safeId !== undefined && (
          <button className="btn-delete" onClick={handleDelete} type="button">
            削除
          </button>
        )}
      </div>
    </PageWrapper>
  );
};

export default PickupRankingDetailPage;
