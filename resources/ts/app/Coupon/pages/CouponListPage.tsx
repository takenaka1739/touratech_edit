import React, { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageWrapper, BoxConditions, TableWrapper, Forms } from '@/components';
import { useCouponListPage } from '@/app/Coupon/uses/useCouponListPage';
import { useComposing } from '@/uses';
import { parseISO, isBefore, isAfter, isWithinInterval } from "date-fns";

/**
 * クーポンマスタ（一覧）画面 Component
 */
export const CouponListPage: React.VFC = () => {
  const title = 'クーポンマスタ';
  const slug = 'coupon';
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
  } = useCouponListPage(slug);
  const { composing, onCompositionStart, onCompositionEnd } = useComposing();
  
  const tables = useMemo(() => {
    const today = new Date();

    // ステータス型
    type StatusType = 'future' | 'current' | 'expired' | 'inactive';

    // ステータスの並び順
    const statusOrder: Record<StatusType, number> = {
      future: 0,
      current: 1,
      expired: 2,
      inactive: 3,
    };

    // データ整形（statusと開始日Dateを付与）
    const rowsWithStatus = state.rows.map(r => {
      const isActive = r.is_active === true;
      const startDate = r.start_at ? parseISO(r.start_at) : null;
      const endDate   = r.end_at   ? parseISO(r.end_at)   : null;
      let status: StatusType = 'inactive'; // デフォルト

      if (isActive && startDate && endDate) {
        if (isWithinInterval(today, { start: startDate, end: endDate })) {
          status = 'current';
        } else if (isBefore(today, startDate)) {
          status = 'future';
        } else if (isAfter(today, endDate)) {
          status = 'expired';
        }
      }
      return {
        ...r,
        status,
        startDateObj: startDate,
        isActive,
      };
    });

    // 並び替え
    rowsWithStatus.sort((a, b) => {
      // ステータス順
      const s1 = statusOrder[a.status as StatusType];
      const s2 = statusOrder[b.status as StatusType];
      if (s1 !== s2) return s1 - s2;
      // 青グループ（future）内は開始日が新しい順
      if (a.status === 'future' && b.status === 'future') {
        if (!a.startDateObj || !b.startDateObj) return 0;
        return b.startDateObj.getTime() - a.startDateObj.getTime(); // 降順（新しい順）
      }
      // 他グループはそのまま
      return 0;
    });

    // 行の色分け用クラス
    const rowClassMap: Record<StatusType, string> = {
      inactive: 'row-inactive',
      current:  'row-is-current',
      expired:  'row-is-expired',
      future:   'row-is-future',
    };

    const tbody = rowsWithStatus.map(r => (
      <tr key={r.id} className={rowClassMap[r.status]}>
        <td>{r.code}</td>
        <td>{r.name}</td>
        <td>{r.details}</td>
        <td className="col-date">{r.start_at?.slice(0, 10)}</td>
        <td className="col-date">{r.end_at?.slice(0, 10)}</td>
        <td className="col-btn">
          <button
            className="btn-toggle"
            onClick={() => onClickToggle(r.id, r.is_active === false)}
          >
            {r.is_active === true ? '有効' : '無効'}
          </button>
        </td>
        <td className="col-btn">
          <Link to={`/${slug}/${r.id}`}>編集</Link>
        </td>
      </tr>
    ));

    return (
      <table>
        <thead>
          <tr>
            <th>コード</th>
            <th>名称</th>
            <th>内容</th>
            <th className="col-date">開始日時</th>
            <th className="col-date">終了日時</th>
            <th className="col-btn">有効/無効</th>
            <th className="col-btn">編集</th>
          </tr>
        </thead>
        <tbody>{tbody}</tbody>
      </table>
    );
  }, [state.rows, onClickToggle]);


  
  useEffect(() => {
    onClickSearchButton(); // 初回マウント時に検索を実行
  }, []);

  return (
    <PageWrapper prefix={slug} title={title} breadcrumb={[{ name: title }]}>
      <BoxConditions
        onClickSearchButton={onClickSearchButton}
        onClickClearButton={onClickClearButton}
      >
        <Forms.FormGroupInputText
          labelText="文字列"
          name="c_keyword"
          value={conditions.c_keyword}
          onChange={onChange}
          onCompositionStart={onCompositionStart}
          onCompositionEnd={onCompositionEnd}
          onKeyDown={e => {
            if (e.key === 'Enter' && !composing) {
              onClickSearchButton();
            }
          }}
          maxLength={30}
          groupClassName="max-w-sm"
          removeOptionalLabel
        />
      </BoxConditions>

      <div style={{
        display: 'flex',
        gap: '20px',
        padding: '10px',
        margin: '10px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '20px', height: '20px', backgroundColor: '#d4f5d4', border: '1px solid #ccc' }}></span>
          <span>有効期限内</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '20px', height: '20px', backgroundColor: '#d4e4ff', border: '1px solid #ccc' }}></span>
          <span>有効期限前</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '20px', height: '20px', backgroundColor: '#ffd4d4', border: '1px solid #ccc' }}></span>
          <span>有効期限切</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '20px', height: '20px', backgroundColor: '#e0e0e0', border: '1px solid #ccc' }}></span>
          <span>無効</span>
        </div>
      </div>

      <TableWrapper pager={state.pager} onChangePage={onChangePage} isLoading={isLoading}>
        {tables}
      </TableWrapper>

      <div className="mt-2">
        <button className="btn" onClick={addDetail}>
          新規追加
        </button>
      </div>
    </PageWrapper>
  );
};

export default CouponListPage;
