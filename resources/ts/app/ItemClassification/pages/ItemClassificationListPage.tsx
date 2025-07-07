import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageWrapper, BoxConditions, TableWrapper, Forms } from '@/components';
import { useItemClassificationListPage } from '../uses/useItemClassificationListPage';
import { useComposing } from '@/uses';

/**
 * 商品分類マスタ（一覧）画面 Component
 */
export const ItemClassificationListPage: React.VFC = () => {
  const title = '商品分類マスタ';
  const slug = 'item_classification';
  const {
    isLoading,
    state,
    conditions,
    onChange,
    onClickSearchButton,
    onClickClearButton,
    onChangePage,
    addDetail,
  } = useItemClassificationListPage(slug);
  const { composing, onCompositionStart, onCompositionEnd } = useComposing();

  const tables = useMemo(() => {
    const tbody = state.rows.map(r => (
      <tr key={r.id}>
        <td>{r.name}</td>
        <td className="col-btn">
          <Link to={`/${slug}/detail/${r.id}`}>編集</Link>
        </td>
      </tr>
    ));

    return (
      <table>
        <thead>
          <tr>
            <th>商品分類名</th>
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
        <button className="btn" onClick={addDetail}>
          新規追加
        </button>
      </div>
    </PageWrapper>
  );
};
