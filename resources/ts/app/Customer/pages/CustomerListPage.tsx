import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageWrapper, BoxConditions, TableWrapper, Forms } from '@/components';
import { useCustomerListPage } from '../uses/useCustomerListPage';
import { useComposing } from '@/uses';

/**
 * 得意先マスタ（一覧）画面 Component
 */
export const CustomerListPage: React.VFC = () => {
  const title = '得意先マスタ';
  const slug = 'customer';
  const {
    isLoading,
    state,
    conditions,
    addDetail,
    onChange,
    onClickSearchButton,
    onClickClearButton,
    onChangePage,
    onClickOutput,
    isDisabled,
  } = useCustomerListPage(slug);
  const { composing, onCompositionStart, onCompositionEnd } = useComposing();

  const tables = useMemo(() => {
    const tbody = state.rows.map(r => (
      <tr key={r.id}>
        <td>{r.name}</td>
        <td>
          <div>〒{r.zip_code}</div>
          <div>
            {r.address1}
            {r.address2}
          </div>
        </td>
        <td>
          <div>TEL:{r.tel}</div>
          {r.fax && <div>FAX:{r.fax}</div>}
        </td>
        <td className="col-btn">
          <Link to={`/${slug}/detail/${r.id}`}>編集</Link>
        </td>
      </tr>
    ));

    return (
      <table>
        <thead>
          <tr>
            <th>得意先名</th>
            <th>住所</th>
            <th className="w-40">連絡先</th>
            <th className="col-btn">編集</th>
          </tr>
        </thead>
        <tbody>{tbody}</tbody>
      </table>
    );
  }, [state.rows]);

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

      <TableWrapper pager={state.pager} onChangePage={onChangePage} isLoading={isLoading}>
        {tables}
      </TableWrapper>
      <div className="mt-2">
        <button className="btn" onClick={addDetail} disabled={isDisabled}>
          新規追加
        </button>
        <button className="btn ml-6" onClick={onClickOutput} disabled={isDisabled}>
          エクセル出力
        </button>
      </div>
    </PageWrapper>
  );
};
