import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageWrapper, BoxConditions, TableWrapper, Forms } from '@/components';
import { useComposing } from '@/uses';
import { useItemClassificationListPage } from '@/app/ItemClassification/uses/useItemClassificationListPage';
import { useFlatItemClassification } from '@/app/ItemClassification/uses/useFlatItemClassification';

/**
 * 商品分類マスタ一覧ページ
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

  // 親から子の順でフラット化（多層構造）
  const flatRows = useFlatItemClassification(state.rows);

  // 1ページの最大表示件数
  const PER_PAGE = 20;

  const pagedRows = useMemo(() => {
    const start = (conditions.page - 1) * PER_PAGE;
    return flatRows.slice(start, start + PER_PAGE);
  }, [flatRows, conditions.page]);

  // pager をフロント側で再構築（Pager 型に完全対応）
  const pager = useMemo(() => {
    const total = flatRows.length;
    const perPage = PER_PAGE;
    const currentPage = conditions.page;

    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const from = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
    const to = Math.min(total, currentPage * perPage);

    return {
      total,
      perPage,
      currentPage,
      lastPage,
      from,
      to,
    };
  }, [flatRows.length, conditions.page]);

  const tables = useMemo(() => {
    const tbody = pagedRows.map(r => {
      const isDisplay = Number(r.is_display) === 1;
      const isTop = r.level === 0;
      const isChild = r.level >= 1;

      return (
        <tr
          key={r.id}
          className={
            r.hiddenByParent
              ? 'row-hidden'
              : isChild
              ? 'row-child'
              : undefined
          }
        >
          <td>
            <div className="name-cell-wrapper">
              {isChild && <span aria-hidden className="child-guide" />}
              <div className="name-cell">
                <span
                  className="indent"
                  style={{ width: 20 * r.level, minWidth: 20 * r.level }}
                />
                {isTop ? (
                  <span className="icon-parent">P</span>
                ) : (
                  <span className="icon-child">{'↳'.repeat(r.level)}</span>
                )}
                <span className={isTop ? 'name-parent' : 'name-child'}>
                  {r.name}
                </span>
              </div>
            </div>
          </td>

          <td>{r.code ?? ''}</td>
          <td>{isDisplay ? '公開' : '非公開'}</td>
          <td className="col-btn">
            <Link to={`/${slug}/detail/${r.id}`}>編集</Link>
          </td>
        </tr>
      );
    });

    return (
      <table>
        <thead>
          <tr>
            <th>商品分類名</th>
            <th>分類コード</th>
            <th>公開設定</th>
            <th className="col-btn">編集</th>
          </tr>
        </thead>
        <tbody>{tbody}</tbody>
      </table>
    );
  }, [pagedRows]);

  return (
    <PageWrapper
      prefix={slug}
      title={title}
      breadcrumb={[{ name: title }]}
      className="item-classification-list-page"
    >
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
            if (e.key === 'Enter' && !composing) onClickSearchButton();
          }}
          maxLength={30}
          groupClassName="max-w-sm"
          removeOptionalLabel
        />
      </BoxConditions>

      {/* 説明ボックス */}
      <div className="item-classification-list-page__legend">
        <div className="item-classification-list-page__legend-item">
          <span className="item-classification-list-page__legend-item-color"></span>
          <span>ショップで非表示となる商品分類</span>
        </div>
      </div>

      <TableWrapper
        pager={pager}
        onChangePage={onChangePage}
        isLoading={isLoading}
      >
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
