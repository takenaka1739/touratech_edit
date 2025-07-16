import React, { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageWrapper, BoxConditions, TableWrapper, Forms } from '@/components';
import { useCouponListPage } from '@/app/Coupon/uses/useCouponListPage';
import { useComposing } from '@/uses';

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
  } = useCouponListPage(slug);
  const { composing, onCompositionStart, onCompositionEnd } = useComposing();

  const tables = useMemo(() => {
    const tbody = state.rows.map(r => (
      <tr key={r.id}>
        <td>{r.code}</td>
        <td>{r.name}</td>
        <td>{r.details}</td>
        <td>{r.start_at?.slice(0, 10)}</td>
        <td>{r.end_at?.slice(0, 10)}</td>
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
            <th>開始日時</th>
            <th>終了日時</th>
            <th className="col-btn">編集</th>
          </tr>
        </thead>
        <tbody>{tbody}</tbody>
      </table>
    );
  }, [state.rows]);

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
          labelText="クーポン名／コード"
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
